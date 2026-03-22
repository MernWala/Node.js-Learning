import { readFile, writeFile } from "fs/promises";
import { file } from "./Structure";
import { AppLogger } from "./AppLogger";

export class FileDBRepository {
    private dbPath: string = "./db/files.json";
    private fileDB: file[];
    private logger: AppLogger;

    constructor() {
        this.fileDB = [];
        this.logger = new AppLogger("FileDBRepository");
    }

    async load(): Promise<file[]> {
        try {
            const data = await readFile(this.dbPath, 'utf-8');
            this.fileDB = JSON.parse(data);
        } catch (error) {
            this.logger.error(error as Error);
            return [];
        }
        return this.fileDB;
    }

    async sync(db: file[]): Promise<file[]> {
        try {
            await writeFile(this.dbPath, JSON.stringify(db, null, 4));
            return db;
        } catch (error) {
            this.logger.error(error as Error);
            throw error;
        }
    }
}