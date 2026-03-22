import { directory, directoryView, file, response, Structure } from "../util/Structure";
import { AppLogger } from "../util/AppLogger";
import { randomUUID } from "node:crypto";
import { FileRepository } from "./FileRepository";
import { DirectoryDBRepository } from "../util/DirectoryDBRepository";

export class DirRepository {
    private dirDB: directory[] = [];
    private struct: Structure;
    private logger: AppLogger;
    private fileRepo?: FileRepository;
    private dbRepo: DirectoryDBRepository;

    constructor() {
        this.struct = new Structure();
        this.dbRepo = new DirectoryDBRepository();
        this.logger = new AppLogger("DirRepository");
    }

    private getFileRepo(): FileRepository {
        if (!this.fileRepo) {
            this.fileRepo = new FileRepository();
        }

        return this.fileRepo;
    }

    private async get(id: string): Promise<directory | null> {
        try {
            this.dirDB = await this.dbRepo.load();
            return this.dirDB.find(d => d.id === id) ?? null;
        } catch (error) {
            this.logger.error(error as Error);
            throw error;
        }
    }

    async create(name: string, parent: string): Promise<directoryView | null> {
        try {
            this.dirDB = await this.dbRepo.load();

            const root = this.dirDB.find(d => d.name === "root" && d.parentDir === null)?.id ?? "";
            if (parent === "root") {
                parent = root;
            }

            if (!root && !parent) {
                parent = (await this.dbRepo.createRoot()).id;
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
            await this.dbRepo.sync(this.dirDB);
            return { id: newDir.id, name: newDir.name, parentDir: newDir.parentDir };

        } catch (error) {
            this.logger.error(error as Error);
            return null;
        }
    }

    async read(id: string): Promise<{ files: file[], directories: directory[] }> {
        try {
            this.logger.info("Reading directory", { id });

            this.dirDB = await this.dbRepo.load();
            const files: file[] = [];
            const directories: directory[] = [];

            // Read the root or specified directory and return its payload (populated)
            const root = this.dirDB.find((d) => !id || id === undefined ? (d.name === "root" && d.parentDir === null) : (d.id === id));

            // Populating files
            for (const file of (root?.payload.files ?? [])) {
                const fetched = await this.getFileRepo().read(file);
                if (fetched) {
                    files.push(fetched);
                }
            }

            // Populating directories
            for (const dir of (root?.payload.directory ?? [])) {
                const fetched = await this.get(dir);
                if (fetched) {
                    directories.push(fetched);
                }
            }

            this.logger.info("Fetched and populated data: ", { files: files.length, directories: directories.length });
            return { files, directories };
        } catch (error) {
            this.logger.error(error as Error);
            throw error;
        }
    }

    async isValidDirectory(id: string): Promise<boolean> {
        try {
            this.dirDB = await this.dbRepo.load();
            for (const dir of this.dirDB) {
                if (id === dir.id) return true;
            }

            return false;
        } catch (error) {
            this.logger.error(error as Error);
            throw error;
        }
    }

    async rename(id: string, name: string): Promise<directoryView | null> {
        try {
            this.dirDB = await this.dbRepo.load();
            let change: directoryView | undefined;

            this.dirDB = this.dirDB.map((dir) => {
                if (dir.id == id) {
                    change = { id, name, parentDir: dir?.parentDir };
                    return { ...dir, name }
                }
                return dir;
            });

            await this.dbRepo.sync(this.dirDB);
            if (change)
                return change;
            return null;
        } catch (error) {
            this.logger.error(error as Error);
            return null
        }
    }

    async move(id: string, parentDir: string, newParent: string): Promise<response> {
        try {

            this.logger.info(`Directory moving`, { id, parentDir, newParent });

            this.dirDB = await this.dbRepo.load();
            let change: directoryView | undefined;

            this.dirDB = this.dirDB.map((dir: directory) => {
                if (dir.id === id) {
                    change = { id, name: dir.name, parentDir: newParent };
                    return { ...dir, parentDir: newParent };
                } else if (dir.id === parentDir) {
                    return {
                        ...dir,
                        payload: {
                            files: dir.payload.files,
                            directory: dir.payload.directory.filter(dId => dId !== id)
                        }
                    }
                } else if (dir.id === newParent) {
                    return {
                        ...dir,
                        payload: {
                            files: dir.payload.files,
                            directory: [...dir.payload.directory, id]
                        }
                    }
                } else {
                    return dir;
                }
            });

            await this.dbRepo.sync(this.dirDB);
            return this.struct.res({
                success: true,
                message: "Directory moved",
                status: 200,
                directory: change
            });

        } catch (error) {
            this.logger.error(error as Error);
            return this.struct.res({
                message: "Server Error!",
                success: false,
                directory: undefined,
                status: 500
            })
        }
    }

    async delete(id: string): Promise<response> {
        try {
            const db = await this.dbRepo.load();
            const newDb = await this.deleteRecursie(id, db);
            await this.dbRepo.sync(newDb);

            return this.struct.res({
                success: true,
                message: "Directory and its children deleted",
                status: 200
            });
        } catch (error) {
            this.logger.error(error as Error);
            throw error;
        }
    }

    async deleteRecursie(id: string, db: directory[]): Promise<directory[]> {
        try {
            this.logger.info(`Finding child directory & files`, { id });
            const obj = db.find(d => d.id === id);
            this.logger.info(`Attempting to remove Files: ${obj?.payload?.files?.length}; Folder: ${obj?.payload?.directory?.length}`, { id });

            if (obj) {
                // Removing file one by by one
                for (const file of (obj?.payload?.files ?? [])) {
                    await this.getFileRepo().delete(file, id);
                }

                // Removing directories one by one
                for (const dir of (obj?.payload?.directory ?? [])) {
                    db = await this.deleteRecursie(dir, db);
                }

                this.logger.info(`Removed Files: ${obj?.payload?.files?.length}; Folder: ${obj?.payload?.directory?.length}`, { id });

                // Now removing self directory and refrence from parent directory
                db = db.filter(directory => directory.id !== id);
                if (obj?.parentDir) {
                    const parent = db.find(d => d.id === obj.parentDir);
                    if (parent) {
                        parent.payload.directory = parent.payload.directory.filter(dId => dId !== id);
                    }
                }

                return db;
            } else {
                return db;
            }
        } catch (error) {
            this.logger.error(error as Error);
            throw error;
        }
    }
}
