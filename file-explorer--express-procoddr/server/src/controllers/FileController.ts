import { AppLogger } from "../util/AppLogger";
import { Request, Response } from "express"
import { action, response, Structure } from "../util/Structure";
import { FileService } from "../service/FileService";

export class FileController {
    private logger: AppLogger;
    private struct: Structure;
    private service: FileService;

    constructor() {
        this.logger = new AppLogger("FileController");
        this.struct = new Structure();
        this.service = new FileService();
    }

    async create(req: Request, res: Response): Promise<Response> {
        this.logger.info("CREATE method called.", {});
        try {
            const { name, folder } = req.headers as { name: string, folder: string | null };
            if (!name) {
                this.logger.info("Validation failed: File name not provided", {});
                return res.status(400).json(this.struct.res({
                    success: false,
                    message: "File name not found.",
                    error: "File name not found.",
                }));
            }

            const filename: string = Array.isArray(name) ? name.join(" ") : name;
            this.logger.info(`Processing file upload`, { filename, folder });
            const response = await this.service.create(filename, req, folder);
            return res.status(200).json(response);
        } catch (error) {
            this.logger.error(error as Error, {});
            return res.status(500).json(this.struct.res({
                success: false,
                error: "Server Error",
                message: "Server Error! Try again later.",
                payload: null,
            }));
        }
    }

    async read(req: Request, res: Response): Promise<Response | void> {
        this.logger.info("READ method called.", {});
        try {
            const { id } = req.params as { id: string };
            const { action } = req.query as { action: action };

            if (!id) {
                this.logger.info("Reading root files", {});
                const response = await this.service.readRoot();
                return res.status(response?.status ?? 200).json(response);
            }

            this.logger.info(`Reading file with action`, { id, action });
            const response = await this.service.read(id, res, action);
            return res.status(response?.status ?? 200).json(response);
        } catch (error) {
            this.logger.error(error as Error, {});
            if (!(error instanceof Error)) {
                const re = error as response
                return res.status(re?.status ?? 404).json(this.struct.res(re));
            }

            return res.status(500).json(this.struct.res({
                success: false,
                error: error.message as string,
                message: "Server Error! Try again later.",
                payload: null,
                status: 500
            }));
        }
    }

    async rename(req: Request, res: Response): Promise<Response> {
        try {
            this.logger.info("RENAME method called.", {});
            const { id, name } = req.body as { id: string, name: string }
            if (!id) {
                this.logger.info("Validation failed: File id is missing", {});
                return res.status(404).json(this.struct.res({
                    success: false,
                    message: "File id is missing",
                    error: "File id is missing",
                }));
            }

            if (!name) {
                this.logger.info("Validation failed: File name is missing", {});
                return res.status(404).json(this.struct.res({
                    success: false,
                    message: "File name is missing",
                    error: "File name is missing",
                }));
            }

            this.logger.info(`Processing rename`, { id, newName: name });
            const response = await this.service.rename(id, name);
            return res.status(response?.status ?? 200).json(response);
        } catch (error) {
            this.logger.error(error as Error, {});
            return res.status(500).json(this.struct.res({
                success: false,
                error: "Server Error",
                message: "Server Error! Try again later.",
                payload: null,
                status: 500
            }));
        }
    }

    async delete(req: Request, res: Response): Promise<Response> {
        try {
            const { id } = req.params as { id: string };
            const { folder } = req.headers as { folder: string | null };

            if (!id) {
                this.logger.info("Validation failed: File id is missing", {});
                return res.status(404).json(this.struct.res({
                    success: false,
                    message: "File id is missing",
                    error: "File id is missing",
                }));
            }

            this.logger.info(`Processing delete`, { id, folder });
            const response = await this.service.delete(id, folder);
            return res.status(response?.status ?? 200).json(response);
        } catch (error) {
            this.logger.error(error as Error, {});
            return res.status(500).json(this.struct.res({
                success: false,
                error: "Server Error",
                message: "Server Error! Try again later.",
                payload: null,
                status: 500
            }));
        }
    }
}