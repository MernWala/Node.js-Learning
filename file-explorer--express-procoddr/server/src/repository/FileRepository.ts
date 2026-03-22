import { directory, file, fileView, Structure } from "../util/Structure";
import { unlink } from "node:fs/promises"
import path from "node:path";
import mime from 'mime';
import { AppLogger } from "../util/AppLogger";
import { FileDBRepository } from "../util/FileDBRepository";
import { DirectoryDBRepository } from "../util/DirectoryDBRepository";

export class FileRepository {
    private fileDB: file[] = [];
    private dirDB: directory[] = [];
    private struct: Structure;;
    private logger: AppLogger;
    private fileDBRepo: FileDBRepository;
    private dirDBRepo: DirectoryDBRepository;

    constructor() {
        this.struct = new Structure();
        this.logger = new AppLogger("File Repository");
        this.fileDBRepo = new FileDBRepository();
        this.dirDBRepo = new DirectoryDBRepository();
    }

    async create({ id, filename, parentDir, size, }: file): Promise<file> {
        this.logger.info(`Inserting file: ${filename}`, { id, filename, parentDir, size });
        this.fileDB = await this.fileDBRepo.load();
        this.dirDB = await this.dirDBRepo.load();

        let rootDir = this.dirDB.find(d => d.name === "root" && d.parentDir === null);
        if (!rootDir) {
            rootDir = await this.dirDBRepo.createRoot();
        }

        const _type: string = mime.getType(path.extname(filename ?? "").replace(".", "")) ?? "<unknown_type>";
        const temp: file = this.struct.file({ id, filename, parentDir, size, fileType: _type });
        this.fileDB.push(temp);

        await this.fileDBRepo.sync(this.fileDB);
        await this.pushFileToDirectory(parentDir ?? rootDir.id, temp.id);

        this.logger.info(`File inserted successfully: ${filename}`, { id, filename });
        return this.struct.file(temp);
    };

    async read(id: string): Promise<file | null> {
        this.fileDB = await this.fileDBRepo.load()
        const res = this.fileDB.find(f => f.id === id);

        if (res?.filename) {
            this.logger.info(`File retrieved: ${res.filename}`, { id, filename: res.filename });
            return res;
        }

        this.logger.info(`File not found`, { id });
        return null;
    };

    async update({ id, filename }: file): Promise<file | null> {
        this.logger.info(`Renaming file`, { id, newFilename: filename });
        this.fileDB = await this.fileDBRepo.load();
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
        await this.fileDBRepo.sync(tempArr);
        this.fileDB = tempArr;
        this.logger.info(`File renamed successfully`, { id, oldName: curr.filename, newName: result.filename });
        return result;
    };

    async delete(id: string, folder: string | null): Promise<file | null> {
        this.logger.info(`Deleting file`, { id, folder });
        this.fileDB = await this.fileDBRepo.load();
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
        await this.fileDBRepo.sync(tempArr);
        this.fileDB = tempArr;

        // Remove file from directory payload
        if (folder) {
            this.logger.info(`Removing fileId from directory of valid folder`, { id, folder });
            await this.removeFileFromDirectory(folder, temp.id);
        } else {
            // Handle root directory case
            this.logger.info(`Removing fileId from root`, { id, folder: "root" });
            await this.removeFileFromDirectory("root", temp.id, true);
        }

        this.logger.info(`File deleted successfully`, { id, filename: temp.filename });
        return temp;
    };

    private async pushFileToDirectory(folder: string | null, fileId: string): Promise<void> {
        this.dirDB = await this.dirDBRepo.load();
        const dirIndex = this.dirDB.findIndex((d: directory) => d.id === folder);
        if (dirIndex !== -1) {
            if (!this.dirDB[dirIndex].payload.files.includes(fileId)) {
                this.dirDB[dirIndex].payload.files.push(fileId);
                await this.dirDBRepo.sync(this.dirDB);
            }
        }

        return;
    }

    private async removeFileFromDirectory(folder: string, fileId: string, root: boolean = false): Promise<void> {
        this.dirDB = await this.dirDBRepo.load();

        const dirIndex = this.dirDB.findIndex(d => root ? (d.parentDir === null && d.name === "root") : (d.id === folder));
        if (dirIndex !== -1) {
            this.logger.info(`Found index of file`, { dirIndex, folder, fileId, root });
            this.dirDB[dirIndex].payload.files = this.dirDB[dirIndex].payload.files.filter((f: string) => f !== fileId);
            await this.dirDBRepo.sync(this.dirDB);
        }

        this.logger.info(`Didn't found fileId from folder`, { dirIndex, folder, fileId, root });
    }

    async move(id: string, parent: string, newParent: string): Promise<fileView | null> {
        try {
            this.dirDB = await this.dirDBRepo.load();
            this.fileDB = await this.fileDBRepo.load();

            this.dirDB = this.dirDB.map(dir => {
                if (dir.id === parent) {
                    return {
                        ...dir,
                        payload: {
                            files: dir.payload.files.filter(f => f !== id),
                            directory: dir.payload.directory
                        }
                    }
                } else if (dir.id === newParent) {
                    return {
                        ...dir,
                        payload: {
                            files: [...dir.payload.files, id],
                            directory: dir.payload.directory
                        }
                    }
                } else {
                    return dir
                }
            });

            this.fileDB = this.fileDB.map(file => file.id === id ? ({ ...file, parentDir: newParent }) : file)

            await this.dirDBRepo.sync(this.dirDB);
            await this.fileDBRepo.sync(this.fileDB);

            const fetch = this.fileDB.find(f => f.id === id);
            if (fetch) {
                return { filename: fetch.filename, id, length: fetch.size ?? 0 };
            }

            return null;
        } catch (error) {
            this.logger.error(error as Error);
            throw error;
        }
    }
}