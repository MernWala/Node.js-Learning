type filePayload = {
    id: string | null,
    filename: string | null,
    length: number | null,
}

type directoryPayload = {
    files: string[],
    directory: string[],
}

export type action = "view" | "download"

export interface response {
    success: boolean,
    error?: string | null,
    message: string,
    status?: number,
    file?: fileView,
    payload?: {
        files: file[],
        directories: directory[],
    },
}

export interface file {
    id: string,
    filename: string | null,
    parentDir?: string | null,
    size?: number,
    fileType?: string | null,
}

export interface directory {
    id: string,
    name: string,
    parentDir: string | null,
    payload: directoryPayload
}

export interface directoryView {
    id: string,
    name: string,
    parentDir: string | null,
    payload: {
        files: file[],
        directory: directory[]
    }
}

export interface fileView {
    filename: string | null,
    id: string,
    length: number,
}

export class Structure {
    res = ({ success, error, message, payload, status, file }: response): response => {
        return { success, error: error ?? null, message, status, payload, file }
    }

    file = ({ id, filename, parentDir, size, fileType }: file) => {
        return { id, filename, parentDir, size, fileType };
    }

    directory = ({ id, name, parentDir, payload }: directory) => {
        return { id, name, parentDir, payload };
    }
}
