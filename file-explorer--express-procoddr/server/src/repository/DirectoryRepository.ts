import { directory, directoryView, file, Structure } from "../util/Structure";
import { writeFile, readFile } from "node:fs/promises";
import { AppLogger } from "../util/AppLogger";
import { randomUUID } from "node:crypto";

export class DirRepository {
    private dirDB: directory[] = [];
    private struct: Structure = new Structure();
    private dbPath: string = "./db/directory.json";
    private logger: AppLogger = new AppLogger("DirRepository");

    constructor() {
        // Constructor to load data from file in future if needed
    }

    private async loadDirDB(): Promise<directory[]> {
        try {
            const data = await readFile(this.dbPath, 'utf-8');
            this.dirDB = JSON.parse(data);
        } catch (error) {
            this.logger.error(error as Error);
            return [];
        }
        return this.dirDB;
    }

    async create(name: string, parent: string): Promise<directoryView | null> {
        try {
            this.dirDB = await this.loadDirDB();

            if (parent === "root") {
                parent = this.dirDB.find(d => d.name === "root" && d.parentDir === null)?.id ?? "";
            }

            const newDir: directory = {
                id: randomUUID(),
                name: name,
                parentDir: parent,
                payload: {
                    directory: [],
                    files: [],
                }
            }

            this.dirDB = this.dirDB.map(d => {
                if (parent === d.id)
                    return { ...d, payload: { files: d.payload.files, directory: [...d.payload.directory, newDir.id] } };
                return d;
            });

            this.dirDB.push(newDir);
            await writeFile(this.dbPath, JSON.stringify(this.dirDB, null, 4));
            return { id: newDir.id, name: newDir.name, parentDir: newDir.parentDir };

        } catch (error) {
            this.logger.error(error as Error);
            return null;
        }
    }

    async isValidDirectory(id: string): Promise<boolean> {
        try {
            this.dirDB = await this.loadDirDB();
            for (const dir of this.dirDB) {
                if (id === dir.id) return true;
            }
            
            return false;
        } catch (error) {
            this.logger.error(error as Error);
            throw error;
        }
    }
};
