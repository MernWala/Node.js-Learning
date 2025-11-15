import { readdir, stat, mkdir } from "fs/promises";
import path from "node:path";

export const handleRead = async (req, res) => {
    try {
        const resData = [];
        const { fullpath } = req.params

        let preparedPath = "";
        preparedPath = fullpath?.join("/") ?? "";
        preparedPath = path.join("/", preparedPath);
        preparedPath = path.join("./uploads", preparedPath);

        const files = await readdir(preparedPath);
        for (const file of files) {
            const s = await stat(path.join(preparedPath, file));
            resData.push({ 
                type: s.isDirectory() ? "dir" : "file",
                file,
                path: path.join(preparedPath, file),
            });
        }

        return res.json(resData);
    } catch (error) {
        console.log("Getting error on controller: /routes/directory -> handleRead:18", error.message);
        return res.json({ status: "Directory not found" });
    }
}

export const handleCreate = async (req, res) => {
    try {

        const { name, target } = req.body;

        const preparedPath = path.join("/", target);
        const fullPath = path.join("./uploads", preparedPath, name)

        await mkdir(fullPath);

        return res.json({
            status: "Directory Created",
            stats: {
                file: name,
                type: "dir",
                path: fullPath
            }
        })

    } catch (error) {
        console.log("Getting error on controller: /routes/directory -> handleCreate:50", error?.message);
        return res.json({ status: "Directory not found" });
    }
}