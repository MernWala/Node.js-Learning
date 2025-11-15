import { createWriteStream, createReadStream, statfsSync } from "fs"
import { readdir, stat, rm, rename, } from "fs/promises";
import path from "node:path";

export const handleCreate = (req, res) => {
    try {
        const { filename, target } = req.headers;
        if (!filename) {
            return res.status(400).json({ status: "No filename found in headers" })
        }

        let fullpath = path.join("/", target);
        fullpath = path.join("./uploads", fullpath, filename);

        const stream = createWriteStream(fullpath);
        req.pipe(stream);

        stream.on("finish", () => {
            if (!res.writableEnded) {
                stream.end();
                return res.json({
                    status: "Upload Finish",
                    file: {
                        file: filename,
                        type: "file",
                        path: fullpath,
                    }
                });
            }
        });

        stream.on("error", (err) => {
            if (!res.writableEnded) {
                stream.end();
                return res.json({ status: "Upload Failed", error: err?.message });
            }
        });

    } catch (error) {
        console.log("Getting error on controller -> handleCreate");
        return res.json({ status: "Server Error" })
    }
};

export const handleRead = async (req, res) => {
    try {
        const { filepath } = req.params
        const { action } = req.query

        const filepathStr = filepath?.join("/");
        let resolvedPath = null;

        if (filepath) {
            resolvedPath = path.join("/", filepathStr);
            resolvedPath = path.join("./uploads", resolvedPath);
        }

        // Case *: No filename means need to serve root directory
        if (!resolvedPath) {
            const resData = [];
            const files = await readdir("./uploads");
            for (const file of files) {
                const s = await stat(path.join("./uploads", file));
                resData.push({ type: s.isDirectory() ? "dir" : "file", file, path: file });
            }

            return res.json(resData);
        }

        // Case 2: Its a file
        const stats = await stat(resolvedPath);
        const mimeType = res.type(resolvedPath);
        res.setHeader("content-type", mimeType);
        res.setHeader("content-length", stats.size);

        if (action === "download") {
            res.setHeader("content-disposition", `attachment; filename=${path.basename(resolvedPath)}`);
        }

        const stream = createReadStream(resolvedPath);
        stream.pipe(res);

        stream.on("error", (err) => {
            console.log("STREAM_ERROR -> handleRead", err);
            if (!res.headersSent) {
                res.status(500).json({ status: "File sent failed" });
            }
        });
    } catch (error) {
        console.log("Getting error on controller -> handleRead", error);
        return res.json({ status: false, message: error?.message });
    }
};

export const handleUpdate = async (req, res) => {
    try {

        let { oldpath, newpath } = req.headers;

        oldpath = path.join("/", oldpath);
        oldpath = path.join("./uploads", oldpath);
        
        newpath = path.join("/", newpath);
        newpath = path.join("./uploads", newpath);

        await rename(oldpath, newpath);
        const stats = await stat(newpath);

        return res.status(200).json({
            status: "File renamed succesfully",
            stats: {
                file: path.basename(newpath),
                type: stats.isDirectory() ? "dir" : "file",
                path: newpath,
                oldname: path.basename(oldpath),
            },
        });

    } catch (error) {
        console.log("Getting error on controller -> handleUpload", error?.message);
        return res.json({ status: "Server Error" })
    }
};

export const handleDelete = async (req, res) => {
    try {
        const { filepath } = req.params;
        const { filetype } = req.headers;

        let filename = filepath.join("/");
        filename = path.join("/", filename);
        filename = path.join("./uploads", filename);

        let isAvailable = null;
        try {
            isAvailable = await stat(filename);
        } catch (error) {
            return res.status(404).json({
                status: false,
                message: `${filetype === "dir" ? "Directory" : "File"} not found.`
            });
        }

        if (isAvailable) {
            if (filetype === "dir") {
                await rm(filename, { recursive: true, force: true });
                return res.json({ status: "Directory Deleted", deleted: path.basename(filename) });
            } else if (filetype === "file") {
                await rm(filename);
                return res.json({ status: "File Deleted", deleted: path.basename(filename) });
            } else {
                return res.status(400).json({
                    success: false,
                    message: "Invalid File!",
                })
            }
        }

    } catch (error) {
        console.log("Getting error on controller -> handleDelete");
        return res.json({ status: "Server Error" });
    }
};
