import { DirectoryService } from "../service/DirectoryService";
import { AppLogger } from "../util/AppLogger";
import { Structure } from "../util/Structure";
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
                    message: "Folder name not found",
                    success: false,
                }));
            }

            if(parentDir !== "root") {
                const test = await this.service.validateDirectory(parentDir);
                if(!test) {
                    return res.status(404).json(this.struct.res({
                        success: false,
                        message: "Directory not found",
                        status: 401
                    }));
                }
            }

            this.logger.info(`Initiated folder creation`, { name, parentDir });
            const response = await this.service.create(name, parentDir);
            this.logger.info(`Folder creation done`, { name, parentDir, response });

            if (!response) {
                return res.status(500).json(this.struct.res({
                    status: 500,
                    success: false,
                    message: "Failed to create directory as controller level.",
                }));
            } else {
                return res.status(200).json(this.struct.res({
                    success: true,
                    message: "Folder Created",
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
}