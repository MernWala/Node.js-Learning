import { directory, file, Structure } from "../util/Structure";
import Directory from "../../db/directory.json" with { type: 'json' };
import Files from "../../db/files.json" with { type: 'json' };
import { writeFile } from "node:fs/promises";
import { writeFileSync } from "node:fs";

export class DirRepository {
    private dirDB: directory[] = Directory;
    private fileDB: file[] = Files;
    private struct: Structure = new Structure();
    private dbPath: string = "./db/directory.json";

    constructor() {
        if (!this.dirDB || this.dirDB.length === 0) {
            this.createSync({
                id: "<dummy_folder>",
                name: "Dummy Folder",
                parentDir: "*",
                payload: {
                    files: [],
                    directory: []
                }
            });
        }
    }

    private createSync(inp: directory): void {
        const temp: directory = this.struct.directory(inp);
        this.dirDB.push(temp);
        // Persist to file synchronously
        writeFileSync(this.dbPath, JSON.stringify(this.dirDB));
    }

    async create(inp: directory): Promise<directory> {
        const temp: directory = this.struct.directory(inp);
        this.dirDB.push(temp);
        await writeFile(this.dbPath, JSON.stringify(this.dirDB));
        return this.struct.directory(temp);
    }

    get(id: string): directory | null {
        const res = this.dirDB.find(d => d.id === id);
        if (res?.name) return res;
        return null;
    }

    getAll(id: string | null): directory[] {
        if (!id) {
            return this.dirDB.filter(d => (d.parentDir?.length === 0 || d.parentDir === null) && (d.name && d.name.length > 0));
        }
        const parent = this.dirDB.find(d => d.id === id);
        const subdirs: directory[] = [];
        if (parent?.payload?.directory) {
            for (const did of parent.payload.directory) {
                const dir = this.dirDB.find(d => d.id === did);
                if (dir) subdirs.push(dir);
            }
        }
        return subdirs;
    }

    async rename(id: string, name: string): Promise<directory | null> {
        let res: directory | null = null;
        const temp = this.dirDB.map(dir => {
            if (dir.id === id) {
                res = { ...dir, name };
                return res;
            }
            return dir;
        });

        await writeFile(this.dbPath, JSON.stringify(temp));
        this.dirDB = temp;
        return res;
    }

    async delete(id: string): Promise<directory | null> {
        const temp = this.dirDB.find(d => d?.id === id);
        if (!temp) return null;
        const tempArr = this.dirDB.filter(d => d?.id !== id);
        await writeFile(this.dbPath, JSON.stringify(tempArr));
        this.dirDB = tempArr;
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
