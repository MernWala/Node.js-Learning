import { DirectoryService } from "../service/DirectoryService";
import { AppLogger } from "../util/AppLogger";
import { directoryView, Structure } from "../util/Structure";
import { Request, Response } from "express";

export class DirectoryController {
    private struct: Structure;
    private service: DirectoryService;
    private logger: AppLogger;

    constructor() {
        this.struct = new Structure();
        this.service = new DirectoryService();
        this.logger = new AppLogger("DirectoryController");
    }

    async create(req: Request, res: Response): Promise<Response> {
        try {
            const { name, parentDir = "root" } = req.body as { name: string, parentDir: string };
            if (!name) {
                return res.status(401).json(this.struct.res({
                    status: 401,
                    message: "Directory name not found",
                    success: false,
                }));
            }

            if (parentDir !== "root") {
                const test = await this.service.validateDirectory(parentDir);
                if (!test) {
                    return res.status(404).json(this.struct.res({
                        success: false,
                        message: "Directory not found",
                        status: 401
                    }));
                }
            }

            this.logger.info(`Initiated folder creation`, { name, parentDir });
            const response = await this.service.create(name, parentDir);
            this.logger.info(`Directory creation done`, { name, parentDir, response });

            if (!response) {
                return res.status(500).json(this.struct.res({
                    status: 500,
                    success: false,
                    message: "Failed to create directory as controller level.",
                }));
            } else {
                return res.status(200).json(this.struct.res({
                    success: true,
                    message: "Directory Created",
                    status: 201,
                    directory: response,
                }));
            }
        } catch (error) {
            this.logger.error(error as Error, {});
            return res.status(500).json(this.struct.res({
                success: false,
                error: "Server Error",
                message: "Server Error! try again later."
            }))
        }
    }

    async rename(req: Request, res: Response): Promise<Response> {
        try {
            const { id, name } = req.body as { id: string, name: string };
            if (!id) {
                return res.status(404).json(this.struct.res({
                    success: false,
                    error: "Id not found in request",
                    message: "Id not found"
                }));
            }

            if (!name) {
                return res.status(404).json(this.struct.res({
                    success: false,
                    error: "Name not found in request",
                    message: "Name not found"
                }));
            }

            const isValidDirectory = await this.service.validateDirectory(id);
            if (!isValidDirectory) {
                return res.status(404).json(this.struct.res({
                    status: 404,
                    success: false,
                    message: "Directory not found",
                    error: "Directory not found",
                }));
            }

            this.logger.info(`Initiating folder rename`, { id, name });
            const response: directoryView | null = await this.service.rename(id, name);

            if (response) {
                this.logger.info(`Rename done of folder`, { id, oldName: response.name, newName: name });
                return res.status(200).json(this.struct.res({
                    success: true,
                    message: "Directory Renamed",
                    directory: response,
                }));
            } else {
                this.logger.info(`Rename failed of folder`, { id, newName: name });
                return res.status(400).json(this.struct.res({
                    success: false,
                    message: "Rename failed",
                    error: "Rename failed"
                }));
            }

        } catch (error) {
            this.logger.error(error as Error);
            return res.status(500).json(this.struct.res({
                success: false,
                error: "Server Error",
                message: "Server Error! Try again later."
            }))
        }
    }
}