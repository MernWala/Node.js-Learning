import { createWriteStream, createReadStream } from "fs"
import { stat } from "fs/promises";
import path from "node:path";
import { AppLogger } from "../util/AppLogger.js";
import { Structure, response } from "../util/Structure.js";
import { randomUUID } from "node:crypto"
import { FileRepository } from "../repository/FileRepository.js";
import { Request, Response } from "express"
import mime from "mime";
import { DirectoryService } from "./DirectoryService.js";

type FileAction = 'download' | 'view'
export class FileService {
    private logger: AppLogger;
    private struct: Structure;
    private repo: FileRepository;
    private dirService: DirectoryService;

    constructor() {
        this.logger = new AppLogger("FileService");
        this.struct = new Structure();
        this.repo = new FileRepository();
        this.dirService = new DirectoryService();
    }

    create = async (filename: string, req: Request, folder: string | null): Promise<response> => {
        this.logger.info("Hitted FileService:create method", { filename, folder });
        // Validate folder exists if folder ID is provided
        if (folder && !await this.dirService.validateDirectory(folder)) {
            return this.struct.res({
                success: false,
                error: "Folder not found",
                message: `Folder with ID '${folder}' does not exist in database`,
                status: 404
            });
        }

        // Validate request body binary - check if file is sent with request
        const contentLength = req.headers['content-length'];
        if (!contentLength || parseInt(contentLength) === 0) {
            this.logger.info("Validation failed: No file data in request", { contentLength });
            return this.struct.res({
                success: false,
                error: "No file data",
                message: "Request body is empty. No file data provided.",
                status: 400
            });
        }

        if (!req.readable) {
            this.logger.info("Validation failed: Request stream is not readable", {});
            return this.struct.res({
                success: false,
                error: "Invalid request stream",
                message: "Request stream is not readable.",
                status: 400
            });
        }

        return new Promise((resolve, reject) => {
            try {
                const id = randomUUID();
                const name = path.basename(filename);
                const filepath = `./uploads/${id}${path.extname(name)}`;

                const stream = createWriteStream(filepath);

                stream.on("finish", async () => {
                    try {
                        const st = await stat(filepath);
                        this.logger.info(`File written to disk successfully`, { id, filename: name, size: st.size });
                        await this.repo.insert(this.struct.file({
                            id,
                            filename: name,
                            parentDir: folder,
                            size: st.size,
                            fileType: mime.getType(path.extname(name)),
                        }));

                        resolve(this.struct.res({
                            success: true,
                            error: null,
                            message: "File created successfully",
                            file: { id, filename: name, length: st.size },
                            status: 201
                        }));
                    } catch (error) {
                        this.logger.error(error as Error, { id, filename: name, message: "Failed to save file metadata" });
                        resolve(this.struct.res({
                            success: false,
                            error: (error as Error).message,
                            message: "Failed to save file metadata",
                            status: 500
                        }));
                    }
                });

                stream.on("error", (error) => {
                    this.logger.error(error as Error, { id, filename: name, filepath, message: "Stream write error" });
                    resolve(this.struct.res({
                        success: false,
                        error: error.message,
                        message: `Failed to write file: ${error.message}`,
                        status: 500
                    }));
                });

                // Pipe request to stream AFTER all event handlers are set up
                req.pipe(stream);
            } catch (error) {
                this.logger.error(error as Error, { message: "Unexpected error in create" });
                reject(error);
            }
        });
    };

    readFile = async (id: string, res: Response, action: FileAction): Promise<response> => {
        this.logger.info("Hitted FileService:read method", { id, action });

        return new Promise(async (resolve, reject) => {
            try {
                const file = await this.repo.get(id);
                if (!file || !file?.filename) {
                    reject(this.struct.res({
                        success: false,
                        error: "File not found",
                        message: "File not found",
                        status: 404,
                    }));
                }

                if (file && file.filename) {
                    const filepath = `./uploads/${file?.id}${path.extname(file?.filename)}`;
                    const stats = await stat(filepath);
                    const stream = createReadStream(filepath);

                    res.setHeader("metadata", JSON.stringify({ filename: file?.filename, id, length: stats.size, }));
                    res.setHeader("Content-Disposition", `${action === "download" ? "attachment" : "inline"}; filename="${file?.filename}"`);

                    stream.pipe(res);
                    stream.on("end", () => {
                        if (!res.headersSent) {
                            resolve(this.struct.res({
                                success: true,
                                error: null,
                                message: "File sent",
                                status: 200,
                                file: { filename: file?.filename, id, length: stats.size, },
                            }));
                        }
                    });

                    stream.on("error", (err) => {
                        this.logger.error(err as Error, { id, filepath });
                        if (!res.headersSent) {
                            resolve(this.struct.res({
                                success: false,
                                error: err?.message,
                                message: "Failed to serve file!",
                                status: 500,
                            }))
                        }
                    });
                }
            } catch (error) {
                this.logger.error(error as Error, {});
                reject(error)
            }
        });
    };

    rename = async (id: string, filename: string): Promise<response> => {
        try {
            const curr = await this.repo.rename({ id, filename });
            if (!curr) {
                return this.struct.res({
                    success: false,
                    message: "Rename failed!",
                    error: "Rename failed",
                    status: 400,
                })
            }

            return this.struct.res({
                success: true,
                file: { filename: curr?.filename, id, length: curr?.size ?? 0 },
                message: "File has been renamed",
                error: null,
                status: 200,
            });
        } catch (error) {
            this.logger.error(error as Error, { id, filename });
            throw error;
        }
    };

    delete = async (id: string, folder: string | null): Promise<response | null> => {
        this.logger.info(`Delete request initiated`, { id, folder: folder ?? "root" });
        try {
            const del = await this.repo.delete(id, folder);
            if (!del) {
                this.logger.info(`Delete failed: File not found in repository`, { id });
                return null;
            }

            this.logger.info(`File deleted successfully from all layers`, { id, filename: del.filename });
            return this.struct.res({
                success: true,
                message: "File Deleted",
                error: null,
                status: 200,
                file: {
                    filename: del?.filename,
                    id: del?.id,
                    length: del?.size ?? 0,
                }
            });
        } catch (error) {
            this.logger.error(error as Error, { id, folder });
            throw error;
        }
    };
}