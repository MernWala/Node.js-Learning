import { directory, file, Structure } from "../util/Structure";
import { writeFile, unlink } from "node:fs/promises"
import Files from "../../db/files.json" with { type: 'json' };
import Directory from "../../db/directory.json" with { type: 'json' };
import path from "node:path";
import mime from 'mime';
import { randomUUID } from "node:crypto";
import { AppLogger } from "../util/AppLogger";

export class FileRepository {
    private fileDB: file[] = Files;
    private dirDB: directory[] = Directory;
    private struct: Structure = new Structure();
    private dbPath: string = "./db/files.json";
    private dirDbPath: string = "./db/directory.json";
    private logger: AppLogger = new AppLogger("FileRepository");

    async insert({ id, filename, parentDir, size, }: file, folder: string | null): Promise<file> {
        this.logger.info(`Inserting file: ${filename}`, { id, filename, folder, size });
        const _type: string = mime.getType(path.extname(filename ?? "").replace(".", "")) ?? "<unknown_type>";
        const temp: file = this.struct.file({ id, filename, parentDir, size, fileType: _type });
        this.fileDB.push(temp);
        await writeFile(this.dbPath, JSON.stringify(this.fileDB));
        await this.pushFileToDirectory(folder ?? null, temp.id);
        this.logger.info(`File inserted successfully: ${filename}`, { id, filename });
        return this.struct.file(temp);
    };

    get(id: string): file | null {
        const res = this.fileDB.find(f => f.id === id);
        if (res?.filename) {
            this.logger.info(`File retrieved: ${res.filename}`, { id, filename: res.filename });
            return res;
        }
        this.logger.info(`File not found`, { id });
        return null;
    };

    directoryExists(id: string): boolean {
        const exists = this.dirDB.some(d => d.id === id);
        if (exists) {
            this.logger.info(`Directory validation: EXISTS`, { directoryId: id });
        } else {
            this.logger.info(`Directory validation: NOT FOUND`, { directoryId: id });
        }
        return exists;
    };

    getAll(folder: string | null): { directories: directory[], files: file[] } {
        const rootDir = this.dirDB.find(d => folder !== null ? (d.id === folder) : (d.parentDir === null && d.name === "root"));

        const files: file[] = [];
        const directories: directory[] = [];

        if (rootDir?.payload?.files) {
            for (const fid of rootDir.payload.files) {
                const file = this.fileDB.find(f => f.id === fid);
                if (file) files.push(file);
            }
        };

        if (rootDir?.payload?.directory) {
            for (const did of rootDir.payload.directory) {
                const dir = this.dirDB.find(d => d.id === did);
                if (dir) directories.push(dir);
            }
        };

        this.logger.info(`Retrieved all root files`, { count: files.length });

        return { directories, files };
    }

    async rename({ id, filename }: file): Promise<file | null> {
        this.logger.info(`Renaming file`, { id, newFilename: filename });
        const curr = this.fileDB.find(f => f.id === id);
        let newName

        if (!curr) {
            this.logger.info(`Rename failed: File not found`, { id });
            return null;
        }

        const temp = this.struct.file({ ...curr, filename, });
        const tempArr = this.fileDB.filter(f => f?.id !== curr?.id);
        if (curr?.filename && temp?.filename) {
            newName = `${path.basename(temp?.filename).split(".")[0]}${path.extname(curr.filename)}`;
        }

        const result = { ...temp, filename: newName ?? curr?.filename }
        tempArr.push(result);
        await writeFile(this.dbPath, JSON.stringify(tempArr));
        this.fileDB = tempArr;
        this.logger.info(`File renamed successfully`, { id, oldName: curr.filename, newName: result.filename });
        return result;
    };

    async delete(id: string, folder: string | null): Promise<file | null> {
        this.logger.info(`Deleting file`, { id, folder });
        const temp = this.fileDB.find(f => f?.id === id);
        if (!temp) {
            this.logger.info(`Delete failed: File not found`, { id });
            return null;
        }

        // Delete physical file from uploads directory
        try {
            const filepath = `./uploads/${temp.id}${path.extname(temp.filename ?? "")}`;
            await unlink(filepath);
            this.logger.info(`Physical file deleted from disk`, { id, filepath });
        } catch (error) {
            this.logger.error(error as Error, { id, message: "Failed to delete physical file" });
        }

        const tempArr = this.fileDB.filter(f => f?.id !== id);
        await writeFile(this.dbPath, JSON.stringify(tempArr));
        this.fileDB = tempArr;

        // Remove file from directory payload
        if (folder) {
            await this.removeFileFromDirectory(folder, temp.id);
        } else {
            // Handle root directory case
            await this.removeFileFromDirectory("root", temp.id, true);
        }

        this.logger.info(`File deleted successfully`, { id, filename: temp.filename });
        return temp;
    };

    private async pushFileToDirectory(folder: string | null, fileId: string): Promise<void> {
        if (!folder) {
            const dir = this.dirDB.find(dir => dir.name === "root");
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
                this.dirDB.push(this.struct.directory({
                    id: randomUUID(),
                    name: "root",
                    parentDir: null,
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