import { directoryView, response, Structure } from "../util/Structure";
import { AppLogger } from "../util/AppLogger";
import { DirRepository } from "../repository/DirectoryRepository";

export class DirectoryService {
    private logger: AppLogger;
    private repo: DirRepository;
    private struc: Structure;

    constructor() {
        this.logger = new AppLogger("DirectoryService");
        this.repo = new DirRepository();
        this.struc = new Structure();
    }

    async create(name: string, parent: string): Promise<directoryView | null> {
        try {
            this.logger.info(`Directory creation started`, { name, parent });
            const res = await this.repo.create(name, parent);
            return res;
        } catch (error) {
            this.logger.error(error as Error);
            return null;
        }
    }

    async read(id: string): Promise<response> {
        try {
            // Validating id, if available
            if (id) {
                const isValid = await this.validateDirectory(id);
                this.logger.info(`Validating directory id`, { id, isValid });
                if (!isValid) {
                    return this.struc.res({
                        success: false,
                        status: 404,
                        message: "Id not found"
                    });
                }
            }

            const result = await this.repo.read(id);
            return this.struc.res({
                success: true,
                message: "Directory readed.",
                status: 200,
                payload: result
            });

        } catch (error) {
            this.logger.error(error as Error);
            throw error;
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

    async rename(id: string, name: string): Promise<directoryView | null> {
        try {
            this.logger.info(`Directory rename initiated`, { id, name });
            const res = await this.repo.rename(id, name);
            return res;
        } catch (error) {
            this.logger.error(error as Error);
            return null;
        }
    }

    async move(id: string, parentDir: string, newParent: string): Promise<response> {
        try {

            this.logger.info(`Directory move initiated`, { id, parentDir, newParent });
            const res = await this.repo.move(id, parentDir, newParent);
            return res;

        } catch (error) {
            this.logger.error(error as Error);
            return this.struc.res({
                message: "Server Error!",
                success: false,
                directory: undefined,
                status: 500
            })
        }
    }

    async delete(id: string): Promise<response> {
        try {

            this.logger.info(`Directory deletion initiated`, { id });
            const res = await this.repo.delete(id);
            return res;

        } catch (error) {
            this.logger.error(error as Error);
            return this.struc.res({
                message: "Server Error!",
                success: false,
                status: 500
            })
        }
    }
}
