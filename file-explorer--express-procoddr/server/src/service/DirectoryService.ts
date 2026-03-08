import { response } from "../util/Structure";
import { AppLogger } from "../util/AppLogger";
import { DirRepository } from "../repository/DirectoryRepository";

export class DirectoryService {
    private logger: AppLogger;
    private repo: DirRepository;

    constructor() {
        this.logger = new AppLogger("DirectoryService");
        this.repo = new DirRepository();
    }

    // async create(): Promise<response> {
    //     try {

    //     } catch (error) {
    //         this.logger.error(error as Error);
    //         throw error;
    //     }
    // }

    // async read(): Promise<response> {
    //     try {

    //     } catch (error) {
    //         this.logger.error(error as Error);
    //         throw error;
    //     }
    // }

    // async update(): Promise<response> {
    //     try {

    //     } catch (error) {
    //         this.logger.error(error as Error);
    //         throw error;
    //     }
    // }

    // async delete(): Promise<response> {
    //     try {

    //     } catch (error) {
    //         this.logger.error(error as Error);
    //         throw error;
    //     }
    // }
}
