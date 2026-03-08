import { createWriteStream, createReadStream } from "fs"
import { stat } from "fs/promises";
import path from "node:path";
import { AppLogger } from "../util/AppLogger.js";
import { Structure, response } from "../util/Structure.js";
import { randomUUID } from "node:crypto"
import { FileRepository } from "../repository/FileRepository.js";
import { Request, Response } from "express"
import mime from "mime";

type FileAction = 'download' | 'view'

export class FileService {
    private logger: AppLogger;
    private struct: Structure;
    private repo: FileRepository;

    constructor() {
        this.logger = new AppLogger("File Controller");
        this.struct = new Structure();
        this.repo = new FileRepository();
    }

    create = async (filename: string, req: Request, folder: string | null): Promise<response> => {
        this.logger.info("Hitted FileService:create method", { filename, folder });

        // Validate folder exists if folder ID is provided
        if (folder && !this.repo.directoryExists(folder)) {
            return this.struct.res({
                success: false,
                error: "Folder not found",
                message: `Folder with ID '${folder}' does not exist in database`,
                payload: null,
                status: 404
            });
        }

        return new Promise((resolve, reject) => {
            try {
                const id = randomUUID();
                const name = path.basename(filename);
                const filepath = `./uploads/${id}${path.extname(name)}`;

                const stream = createWriteStream(filepath);
                req.pipe(stream);

                stream.on("finish", async () => {
                    try {
                        const st = await stat(filepath);
                        this.logger.info(`File written to disk successfully`, { id, filename: name, size: st.size });
                        await this.repo.insert(this.struct.file({
                            id,
                            filename: name,
                            parentDir: null,
                            size: st.size,
                            fileType: mime.getType(path.extname(name)),
                        }), folder);

                        resolve(this.struct.res({
                            success: true,
                            error: null,
                            message: "File created successfully",
                            payload: { id, filename: name, length: st.size },
                            status: 201
                        }));
                    } catch (error) {
                        this.logger.error(error as Error, { id, filename: name });
                        resolve(this.struct.res({
                            success: false,
                            error: "Failed to save file metadata",
                            message: "Failed to save file metadata",
                            payload: null,
                            status: 500
                        }));
                    }
                });

                stream.on("error", (error) => {
                    this.logger.error(error as Error, { id, filename: name, filepath });
                    resolve(this.struct.res({
                        success: false,
                        error: "File write error",
                        message: "File write error",
                        payload: null,
                        status: 500
                    }));
                });
            } catch (error) {
                this.logger.error(error as Error, {});
                reject(error);
            }
        });
    };

    read = async (id: string, res: Response, action: FileAction): Promise<response> => {
        this.logger.info("Hitted FileService:read method", { id, action });

        return new Promise(async (resolve, reject) => {
            try {
                if (id === "<dummy_file>") {
                    reject(this.struct.res({
                        success: false,
                        error: "File not found",
                        message: "File not f2ound",
                        payload: null,
                        status: 404,
                    }));
                };

                const file = this.repo.get(id);
                if (!file || !file?.filename) {
                    reject(this.struct.res({
                        success: false,
                        error: "File not found",
                        message: "File not f2ound",
                        payload: null,
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
                                payload: { filename: file?.filename, id, length: stats.size, },
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

    readRoot = (): response => {
        this.logger.info("Hitted FileService:readRoot method", {});
        try {
            const all = this.repo.getAll(null).filter(f => f.id !== "<dummy_file>");
            this.logger.info(`Root files loaded`, { totalFiles: all.length });

            if (!all || all.length === 0) {
                this.logger.info(`No files found in root`, {});
                return this.struct.res({
                    success: false,
                    payload: null,
                    message: "Failed to load data",
                    error: "Unable to fetch data",
                    status: 500
                });
            }

            return this.struct.res({
                success: true,
                payload: all,
                message: "Data loaded successfully",
                error: null,
                status: 200
            });
        } catch (error) {
            this.logger.error(error as Error, {});
            throw error;
        }
    }

    rename = async (id: string, filename: string): Promise<response> => {
        try {
            const curr = await this.repo.rename({ id, filename });

            return this.struct.res({
                success: curr ? true : false,
                payload: curr ? { filename: curr?.filename, id, length: curr?.size ?? 0 } : null,
                message: curr ? "File has been renamed" : "Rename procedure failed",
                error: curr ? null : "Rename procedure failed",
                status: curr ? 200 : 400
            });
        } catch (error) {
            this.logger.error(error as Error, { id, filename });
            throw error;
        }
    };

    delete = async (id: string, folder: string | null): Promise<response | null> => {
        this.logger.info(`Delete request initiated`, { id, folder: folder ?? "(root)" });
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
                status: 200,
                payload: {
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