import express from "express";
import multer from "multer";
import path from "path";
import crypto from "crypto";

const app = express()
const port = 5000

// Basic multer configuration
// const upload = multer({ dest: "./upload" })

// Detail configuration setup
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './upload');
    },
    filename: function (req, file, cb) {
        const id = crypto.randomUUID()
        const extention = path.extname(file.originalname);

        cb(null, `${id}${extention}`);
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

app.listen(port, () => {
    console.log(`Server is listning at port: ${port}`);
});
