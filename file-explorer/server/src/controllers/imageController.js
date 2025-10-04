import { createWriteStream } from "fs"

const getStream = (filename) => {
    try {
        const writeableStream = createWriteStream(`./uploads/images/${filename}.jpg`);
        return writeableStream
    } catch (error) {
        throw error
    }
}

export const createFile = (req, res) => {
    const stream = getStream(req.body.file);
    req.pipe(stream);
    req.on("end", () => {
        return res.json({ message: "File Uploaded" })
    });
};

export const readFile = (req, res) => {
    return res.json({ message: "Hello from imageController -> readFile" })
};

export const updateFile = (req, res) => {
    return res.json({ message: "Hello from imageController -> updateFile" })
};

export const deleteFile = (req, res) => {
    return res.json({ message: "Hello from imageController -> deleteFile" })
};
