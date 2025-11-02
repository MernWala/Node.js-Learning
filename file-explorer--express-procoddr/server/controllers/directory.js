import { readdir, stat, rmdir, rename, mkdir } from "fs/promises";

export const handleRead = async (req, res) => {
    try {
        const resData = [];
        const { fullpath: path } = req.params

        const fullPath = path.join("/");

        const files = await readdir(`./uploads/${fullPath}`);
        for (const file of files) {
            const s = await stat(`./uploads/${fullPath}/${file}`);
            resData.push({ type: s.isDirectory() ? "dir" : "file", file, path: `${fullPath}/${file}` });
        }

        return res.json(resData);
    } catch (error) {
        console.log("Getting error on controller: /routes/directory -> handleRead:18", error.message);
        return res.json({ status: "Directory not found" });
    }
}

export const handleCreate = async (req, res) => {
    try {

        const { name, path } = req.body;
        await mkdir(`./uploads/${path}${path.length > 0 ? '/' : ''}${name}`)

        return res.json({
            status: "Directory Created",
            stats: {
                file: name,
                type: "dir",
                path
            }
        })

    } catch (error) {
        console.log("Getting error on controller: /routes/directory -> handleRead:18", error.message);
        return res.json({ status: "Directory not found" });
    }
}