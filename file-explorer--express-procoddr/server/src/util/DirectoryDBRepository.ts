import { readFile, writeFile } from "fs/promises";
import { directory } from "./Structure";
import { AppLogger } from "./AppLogger";
import { randomUUID } from "crypto";

export class DirectoryDBRepository {
    private DBPath: string = "./db/directory.json";
    private db: directory[];
    private logger: AppLogger;

    constructor() {
        this.db = [];
        this.logger = new AppLogger("DirectoryDBRepository");
    }

    async load(): Promise<directory[]> {
        try {
            const data = await readFile(this.DBPath, 'utf-8');
            this.db = JSON.parse(data);
        } catch (error) {
            this.logger.error(error as Error);
            return [];
        }

        return this.db;
    }

    async sync(db: directory[]): Promise<directory[]> {
        try {
            // Iterate throw every directory.payload.directories + directory.payload.files
            // And wrape them into Set() then expand it with new Array
            db = db.map(dir => {
                const obj: directory = dir;
                const dirId = [...new Set(obj.payload.directory)];
                const fileId = [...new Set(obj.payload.files)];
                return { ...obj, payload: { directory: dirId, files: fileId } };
            });

            await writeFile(this.DBPath, JSON.stringify(db, null, 4));
            return db
        } catch (error) {
            this.logger.error(error as Error);
            throw error;
        }
    }

    async createRoot(): Promise<directory> {
        try {
            this.db = await this.load();
            const root: directory = {
                id: randomUUID(),
                name: "root",
                parentDir: null,
                payload: {
                    directory: [],
                    files: [],
                }
            }

            this.db.push(root);

            await writeFile(this.DBPath, JSON.stringify(this.db, null, 4))
            return root;
        } catch (error) {
            this.logger.error(error as Error);
            throw error;
        }
    }
}