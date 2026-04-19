import express from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";
import cors from "cors";
import fs from "fs";

const app = express()
const port = 5000

// Ensure upload directory exists
const uploadDir = './upload';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log(`Created upload directory: ${uploadDir}`);
}

app.use(cors());

// Basic multer configuration
// const upload = multer({ dest: "./upload" })

// Detail configuration setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadPath = './upload';
        // Verify directory exists and is writable
        if (!fs.existsSync(uploadPath)) {
            return cb(new Error(`Upload directory does not exist: ${uploadPath}`));
        }
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        try {
            const id = crypto.randomUUID()
            const extention = path.extname(file.originalname);
            cb(null, `${id}${extention}`);
        } catch (err) {
            cb(err);
        }
    }
});

const upload = multer({ storage });

/* 
    To upload single file just use 
    upload.single("<field-name>") -> input tag name

    to Upload multiple files, we need to use
    upload.fields([{name: "<field-name>", maxCount: 5}, {name: "<field-name>", maxLimit: 5}])
*/

app.post("/upload",
    // upload.single("profile"),    // Will handle single field with single file
    upload.fields([{ name: "profile", maxCount: 5 }]),  // Will handle multiple field with multiple files
    (req, res) => {
        // req.on("data", (chunk) => {
        //     console.log(chunk.toString());
        // })
        // req.on("end", () => {
        //     res.json({ message: "Data sent!" })
        // })

        // We can see everything in req.body -> Multer internally patch data to req.body
        console.log(req.body);

        return res.json({ "success": true, message: "File uploaded successfully!", file: req.files });
    }
);

// Error handler - catches multer and other errors
app.use((err, req, res, next) => {
    console.error("ERROR:", err.message);
    
    if (err instanceof multer.MulterError) {
        return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
    } else if (err) {
        return res.status(500).json({ success: false, message: `Error: ${err.message}` });
    }
});

app.listen(port, () => {
    console.log(`Server is listening at port: ${port}`);
});
