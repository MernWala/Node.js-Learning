import { DirectoryDBRepository } from "./DirectoryDBRepository";
import { FileDBRepository } from "./FileDBRepository";
import { directory, directoryView, file, PathView } from "./Structure";

type EnrichType = "dir" | "file";

export class EnrichPath {
    private fileDBRepo: FileDBRepository;
    private dirDBRepo: DirectoryDBRepository;
    private dirDb: directory[] = [];
    private fileDB: file[] = []

    constructor() {
        this.fileDBRepo = new FileDBRepository();
        this.dirDBRepo = new DirectoryDBRepository();
    }

    async getFullPath(id: string, type: EnrichType = "dir"): Promise<PathView[]> {
        let get: any;
        this.dirDb = await this.dirDBRepo.load();

        if (type === "dir") {
            get = this.dirDb.find(d => d.id === id);
        } else {
            this.fileDB = await this.fileDBRepo.load();
            get = this.fileDB.find(f => f.id === id);
            get = { ...get, name: get.filename }
        }

        if (get !== undefined) {
            const calculated = await this.getFullPathHelp(get, this.dirDb, []);
            return calculated;
        }

        return [];
    }

    private async getFullPathHelp(dir: directoryView, memory: directory[], result: PathView[]): Promise<PathView[]> {
        if (!dir) return [];
        const parent = memory.find(f => f.id === dir.parentDir);
        if (parent !== undefined) {
            const calculated = await this.getFullPathHelp(parent, memory, result);
            return [...calculated, { id: dir.id, name: dir.name }];
        } else if (dir.parentDir === null) {
            this.dirDb = await this.dirDBRepo.load()
            const root = this.dirDb.find(d => d.parentDir === null && d.name == "root");
            if (root !== undefined) {
                return [...result, { id: root?.id, name: "Home" }]
            } else {
                return result;
            }
        } else {
            return result;
        }
    }
}