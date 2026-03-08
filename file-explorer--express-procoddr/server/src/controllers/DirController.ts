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

    // async create(req: Request, res: Response): Promise<Response> {
    //     try {

    //     } catch (error) {
    //         this.logger.error(error as Error, {});
    //         return res.status(500).json(this.struct.res({
    //             success: false,
    //             error: Error("Server Error"),
    //             message: "Server Error! Try again later.",
    //             payload: null,
    //             status: 500
    //         }));
    //     }
    // }

    // async read(req: Request, res: Response): Promise<Response> {
    //     try {

    //     } catch (error) {
    //         this.logger.error(error as Error, {});
    //         return res.status(500).json(this.struct.res({
    //             success: false,
    //             error: Error("Server Error"),
    //             message: "Server Error! Try again later.",
    //             payload: null,
    //             status: 500
    //         }));
    //     }
    // }

    // async rename(req: Request, res: Response): Promise<Response> {
    //     try {

    //     } catch (error) {
    //         this.logger.error(error as Error, {});
    //         return res.status(500).json(this.struct.res({
    //             success: false,
    //             error: Error("Server Error"),
    //             message: "Server Error! Try again later.",
    //             payload: null,
    //             status: 500
    //         }));
    //     }
    // }

    // async delete(req: Request, res: Response): Promise<Response> {
    //     try {

    //     } catch (error) {
    //         this.logger.error(error as Error, {});
    //         return res.status(500).json(this.struct.res({
    //             success: false,
    //             error: Error("Server Error"),
    //             message: "Server Error! Try again later.",
    //             payload: null,
    //             status: 500
    //         }));
    //     }
    // }
}