import { directoryView } from "../util/Structure";
import { AppLogger } from "../util/AppLogger";
import { DirRepository } from "../repository/DirectoryRepository";

export class DirectoryService {
    private logger: AppLogger;
    private repo: DirRepository;

    constructor() {
        this.logger = new AppLogger("DirectoryService");
        this.repo = new DirRepository();
    }

    async create(name: string, parent: string): Promise<directoryView | null> {
        try {
            this.logger.info(`Folder creation started`, { name, parent });
            const res = await this.repo.create(name, parent);
            return res;
        } catch (error) {
            this.logger.error(error as Error);
            return null;
        }
    }

    async validateDirectory(id: string): Promise<boolean> {
        try {
            this.logger.info('Validating directory id', { id });
            return await this.repo.isValidDirectory(id);
        } catch (error) {
            this.logger.error(error as Error);
            return false;
        }
    }
}
