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

    
}