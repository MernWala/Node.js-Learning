import { directory, file, Structure } from "../util/Structure";
import { writeFile } from "node:fs/promises"
import { writeFileSync } from "node:fs"
import Files from "../../db/files.json" with { type: 'json' };
import Directory from "../../db/directory.json" with { type: 'json' };
import path from "node:path";
import mime from 'mime';
import { randomUUID } from "node:crypto";

export class FileRepository {
    private fileDB: file[] = Files;
    private dirDB: directory[] = Directory;
    private struct: Structure = new Structure();
    private dbPath: string = "./db/files.json";
    private dirDbPath: string = "./db/directory.json";

    constructor() {
        if (Files.length === 0) {
            this.insertSync({
                "id": "<dummy_file>",
                "filename": "Dummy File",
                "parentDir": null,
                "size": 0,
            })
        }
    }

    private insertSync({ id, filename, parentDir, size }: file): void {
        const _type: string = mime.getType(path.extname(filename ?? "").replace(".", "")) ?? "<unknown_type>";
        const temp: file = this.struct.file({ id, filename, parentDir, size, fileType: _type });
        this.fileDB.push(temp);
        // Persist to file synchronously
        writeFileSync(this.dbPath, JSON.stringify(this.fileDB));
    }

    async insert({ id, filename, parentDir, size, }: file, folder: string | null): Promise<file> {
        const _type: string = mime.getType(path.extname(filename ?? "").replace(".", "")) ?? "<unknown_type>";
        const temp: file = this.struct.file({ id, filename, parentDir, size, fileType: _type });
        this.fileDB.push(temp);
        await writeFile(this.dbPath, JSON.stringify(this.fileDB));
        await this.pushFileToDirectory(folder ?? null, temp.id);

        return this.struct.file(temp);
    };

    get(id: string): file | null {
        const res = this.fileDB.find(f => f.id === id);
        if (res?.filename) return res;
        return null;
    };

    directoryExists(id: string): boolean {
        return this.dirDB.some(d => d.id === id);
    };

    getAll(folder: string | null): file[] {
        if (!folder) {
            return this.fileDB.filter(f => (f.parentDir?.length === 0 || f.parentDir === null) && (f.filename && f.filename.length > 0));
        }
        // Return files for specific folder
        const dir = this.dirDB.find((d: any) => d.id === folder);
        const files: file[] = [];
        if (dir?.payload?.files) {
            for (const fid of dir.payload.files) {
                const file = this.fileDB.find(f => f.id === fid);
                if (file) files.push(file);
            }
        }
        return files;
    }

    async rename({ id, filename }: file): Promise<file | null> {
        const curr = this.fileDB.find(f => f.id === id);
        let newName

        if (!curr) return null;

        const temp = this.struct.file({ ...curr, filename, });
        const tempArr = this.fileDB.filter(f => f?.id !== curr?.id);
        if (curr?.filename && temp?.filename) {
            newName = `${path.basename(temp?.filename).split(".")[0]}${path.extname(curr.filename)}`;
        }

        const result = { ...temp, filename: newName ?? curr?.filename }
        tempArr.push(result);
        await writeFile(this.dbPath, JSON.stringify(tempArr));
        this.fileDB = tempArr;
        return result;
    };

    async delete(id: string, folder: string | null): Promise<file | null> {
        const temp = this.fileDB.find(f => f?.id === id);
        if (!temp) return null;
        const tempArr = this.fileDB.filter(f => f?.id !== id);
        await writeFile(this.dbPath, JSON.stringify(tempArr));
        this.fileDB = tempArr;

        // Remove file from directory payload
        if (folder || folder === "root") {
            await this.removeFileFromDirectory(folder, temp.id);
        }

        return temp;
    };

    private async pushFileToDirectory(folder: string | null, fileId: string): Promise<void> {
        if (!folder) {
            const dir = this.dirDB.find(dir => dir.parentDir === "root");
            if (dir) {
                this.dirDB.map(d => {
                    if (d.parentDir === null) {
                        return this.struct.directory({
                            id: d.id,
                            name: d.name,
                            parentDir: null,
                            payload: {
                                files: [...d.payload.files, fileId],
                                directory: d.payload.directory,
                            }
                        })
                    }

                    return d;
                });
            } else {
                const tId = randomUUID();
                this.dirDB.push(this.struct.directory({
                    id: tId,
                    name: "",
                    parentDir: "root",
                    payload: {
                        directory: [],
                        files: [fileId]
                    }
                }));
            }

            await writeFile(this.dirDbPath, JSON.stringify(this.dirDB));
            return;
        }

        const dirIndex = this.dirDB.findIndex((d: directory) => d.id === folder);
        if (dirIndex !== -1) {
            if (!this.dirDB[dirIndex].payload.files.includes(fileId)) {
                this.dirDB[dirIndex].payload.files.push(fileId);
                await writeFile(this.dirDbPath, JSON.stringify(this.dirDB));
            }
        }

        return;
    }

    private async removeFileFromDirectory(folder: string, fileId: string, root: boolean = false): Promise<void> {
        const dirIndex = this.dirDB.findIndex(d => root ? (d.parentDir === "root") : (d.id === folder));
        if (dirIndex !== -1) {
            this.dirDB[dirIndex].payload.files = this.dirDB[dirIndex].payload.files.filter((f: string) => f !== fileId);
            await writeFile(this.dirDbPath, JSON.stringify(this.dirDB));
        }
    }
}