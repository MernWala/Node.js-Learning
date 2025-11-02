import { createWriteStream, createReadStream } from "fs"
import { readdir, stat, rm, rename, rmdir, statfs } from "fs/promises";

export const handleCreate = (req, res) => {
    try {
        const { filename, path } = req.headers;
        if (!filename) {
            return res.status(400).json({ status: "No filename found in headers" })
        }

        const stream = createWriteStream(`./uploads/${path}${path.length > 0 ? "/" : ""}${filename}`);
        req.pipe(stream);

        stream.on("finish", () => {
            if (!res.writableEnded) {
                stream.end();
                return res.json({
                    status: "Upload Finish",
                    file: {
                        file: filename,
                        type: "file",
                        path: path.concat(path.length > 0 ? "/" : "").concat(filename),
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

        // Case *: No filename means need to serve root directory
        if (!filepath) {
            const resData = [];
            const files = await readdir("./uploads");
            for (const file of files) {
                const s = await stat(`./uploads/${file}`);
                resData.push({ type: s.isDirectory() ? "dir" : "file", file, path: file });
            }

            return res.json(resData);
        }

        // Case 2: Its a file
        const filename = filepath.join("/");
        const stats = await stat(`./uploads/${filename}`);
        const mimeType = res.type(filename);
        res.setHeader("content-type", mimeType);
        res.setHeader("content-length", stats.size);

        if (action === "download") {
            res.setHeader("content-disposition", `attachment; filename=${filename}`);
        }

        const stream = createReadStream(`./uploads/${filename}`);
        stream.pipe(res);

        stream.on("error", (err) => {
            console.log("STREAM_ERROR -> handleRead", err);
            if (!res.headersSent) {
                res.status(500).json({ status: "File sent failed" });
            }
        });
    } catch (error) {
        console.log("Getting error on controller -> handleRead");
        return res.json({ status: "Server Error" });
    }
};

export const handleUpdate = async (req, res) => {
    try {

        const { oldpath, newpath } = req.headers;
        await rename(`./uploads/${oldpath}`, `./uploads/${newpath}`)

        const oldArr = oldpath.split("/");
        const newArr = newpath.split("/");

        const stats = await statfs(`./uploads/${newpath}`);

        return res.status(200).json({
            status: "File renamed succesfully",
            stats: {
                file: newArr[newArr.length - 1],
                type: stats.isDirectory ? "dir" : "file",
                path: newpath,
                oldname: oldArr[oldArr.length - 1],
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
        const filename = filepath.join("/");

        if (filetype === "dir") {
            await rm(`./uploads/${filename}`, { recursive: true, force: true });
        } else {
            await rm(`./uploads/${filename}`);
        }

        return res.json({ status: `${filetype === "dir" ? "Directory" : "File"} Deleted`, deleted: filepath[filepath.length - 1] })

    } catch (error) {
        console.log("Getting error on controller -> handleDelete");
        return res.json({ status: "Server Error" })
    }
};
