import { directory, file, Structure } from "../util/Structure";
import Directory from "../../db/directory.json" with { type: 'json' };
import Files from "../../db/files.json" with { type: 'json' };
import { writeFile } from "node:fs/promises";
import { writeFileSync } from "node:fs";
import { AppLogger } from "../util/AppLogger";
import { randomUUID } from "node:crypto";

export class DirRepository {
    private dirDB: directory[] = Directory;
    private fileDB: file[] = Files;
    private struct: Structure = new Structure();
    private dbPath: string = "./db/directory.json";
    private logger: AppLogger = new AppLogger("DirRepository");

    async create(inp: directory): Promise<directory> {
        this.logger.info(`Creating directory: ${inp.name}`, { id: inp.id, name: inp.name, parentDir: inp.parentDir });
        const temp: directory = this.struct.directory(inp);
        this.dirDB.push(temp);
        await writeFile(this.dbPath, JSON.stringify(this.dirDB));
        this.logger.info(`Directory created successfully`, { id: temp.id, name: temp.name });
        return this.struct.directory(temp);
    }

    get(id: string): directory | null {
        const res = this.dirDB.find(d => d.id === id);
        if (res?.name) {
            this.logger.info(`Directory retrieved: ${res.name}`, { id, name: res.name });
            return res;
        }
        this.logger.info(`Directory not found`, { id });
        return null;
    }

    getAll(id: string | null): directory[] {
        if (!id) {
            const dirs = this.dirDB.filter(d => (d.parentDir?.length === 0 || d.parentDir === null) && (d.name && d.name.length > 0));
            this.logger.info(`Retrieved all root directories`, { count: dirs.length });
            return dirs;
        }
        const parent = this.dirDB.find(d => d.id === id);
        const subdirs: directory[] = [];
        if (parent?.payload?.directory) {
            for (const did of parent.payload.directory) {
                const dir = this.dirDB.find(d => d.id === did);
                if (dir) subdirs.push(dir);
            }
        }
        this.logger.info(`Retrieved subdirectories`, { parentId: id, count: subdirs.length });
        return subdirs;
    }

    async rename(id: string, name: string): Promise<directory | null> {
        this.logger.info(`Renaming directory`, { id, newName: name });
        let res: directory | null = null;
        const temp = this.dirDB.map(dir => {
            if (dir.id === id) {
                res = { ...dir, name };
                return res;
            }
            return dir;
        });

        if (!res) {
            this.logger.info(`Rename failed: Directory not found`, { id });
            return null;
        }

        await writeFile(this.dbPath, JSON.stringify(temp));
        this.dirDB = temp;
        this.logger.info(`Directory renamed successfully`, { id, newName: name });
        return res;
    }

    async delete(id: string): Promise<directory | null> {
        this.logger.info(`Deleting directory`, { id });
        const temp = this.dirDB.find(d => d?.id === id);
        if (!temp) {
            this.logger.info(`Delete failed: Directory not found`, { id });
            return null;
        }
        const tempArr = this.dirDB.filter(d => d?.id !== id);
        await writeFile(this.dbPath, JSON.stringify(tempArr));
        this.dirDB = tempArr;
        this.logger.info(`Directory deleted successfully`, { id, name: temp.name });
        return temp;
    }

    getContent(id: string | null): { files: file[], directory: directory[] } {
        const temp = this.dirDB.find(d => d.id === id) ?? null;
        const res: { files: file[], directory: directory[] } = {
            files: [],
            directory: [],
        }

        // Get files from payload
        for (const fid of (temp?.payload.files ?? [])) {
            const fileItem = this.fileDB.find(f => f.id === fid);
            if (fileItem) res?.files.push(fileItem);
        }

        // Get directories from payload
        for (const did of (temp?.payload.directory ?? [])) {
            const dirItem = this.get(did);
            if (dirItem) res?.directory.push(dirItem);
        }

        return res;
    }

    async pushFile(folder: string | null, payload: string): Promise<directory | null> {
        let res: directory | null = null;
        const temp = this.dirDB.map((dir) => {
            if (dir.id === folder) {
                res = {
                    ...dir,
                    payload: {
                        files: [...dir?.payload.files, payload],
                        directory: dir?.payload.directory,
                    }
                };

                return res;
            }

            return dir;
        });

        await writeFile(this.dbPath, JSON.stringify(temp));
        this.dirDB = temp;
        return res;
    }

    async pushDirectory(folder: string | null, payload: string): Promise<directory | null> {
        let res: directory | null = null;
        const temp = this.dirDB.map((dir) => {
            if (dir.id === folder) {
                res = {
                    ...dir,
                    payload: {
                        files: dir?.payload.files,
                        directory: [...dir?.payload.directory, payload],
                    }
                };

                return res;
            }

            return dir;
        });

        await writeFile(this.dbPath, JSON.stringify(temp));
        this.dirDB = temp;
        return res;
    }

    async popFile(folder: string | null, payload: string): Promise<directory | null> {
        let res: directory | null = null;
        const temp = this.dirDB.map((dir) => {
            if (dir.id === folder) {
                res = {
                    ...dir,
                    payload: {
                        files: dir?.payload.files.filter(f => f !== payload),
                        directory: dir?.payload.directory,
                    }
                };

                return res;
            }

            return dir;
        });

        await writeFile(this.dbPath, JSON.stringify(temp));
        this.dirDB = temp;
        return res;
    }

    async popDirectory(folder: string | null, payload: string): Promise<directory | null> {
        let res: directory | null = null;
        const temp = this.dirDB.map((dir) => {
            if (dir.id === folder) {
                res = {
                    ...dir,
                    payload: {
                        files: dir?.payload.files,
                        directory: dir?.payload.directory.filter(d => d !== payload),
                    }
                };

                return res;
            }

            return dir;
        });

        await writeFile(this.dbPath, JSON.stringify(temp));
        this.dirDB = temp;
        return res;
    }
};
