import { createWriteStream } from 'fs';
import { rm, rename } from "fs/promises"
import { open, readdir } from 'fs/promises';
import http from 'http'
import mime from "mime-types"

const server = http.createServer(async (req, res) => {

    // cors setup
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "*");
    res.setHeader("Access-Control-Allow-Methods", "*");

    if (req.url === "/favicon.ico") return res.end("no favicon");
    let [filename, queryString] = req.url.split("?")

    switch (req.method) {
        case "GET": {
            if (req.url === "/") {
                const items = await readdir("./uploads");
                res.setHeader("content-type", "application/json");
                res.end(JSON.stringify(items));
            } else {
                let temp = filename.split("/")
                filename = temp[temp.length - 1];

                try {
                    const file = await open(`./uploads/${decodeURIComponent(filename)}`);
                    const readStream = file.createReadStream()
                    const stats = await file.stat();

                    if (queryString) {
                        queryString.split("&").forEach((query) => {
                            const [key, val] = query.split("=")
                            if (key === "action" && val === "open") {
                                let type = mime.contentType(filename.replaceAll("/", ""));
                                if (type === "application/mp4") type = "video/mp4";
                                res.setHeader("Content-Type", type);
                            } else if (key === "action" && val === "download") {
                                res.setHeader("content-disposition", `attachment; filename=${filename.replaceAll("/", "")}`);
                                res.setHeader("content-length", stats.size);
                            }
                        });
                    }

                    readStream.pipe(res);
                } catch (error) {
                    res.end("File not found");
                }
            }

            break;
        }

        case "POST": {
            if (req.url === "/") {
                res.setHeader("content-type", "application/json");
                const stream = createWriteStream(`./uploads/${req.headers?.filename}`);
                req.pipe(stream);

                stream.on("finish", () => {
                    if (!res.writableEnded) {
                        res.end(JSON.stringify({ status: "Upload Finish", file: req.headers?.filename }));
                        stream.end();
                    }
                });

                stream.on("error", (err) => {
                    if (!res.writableEnded) {
                        res.end(JSON.stringify({ status: "Upload Failed", error: err }));
                        stream.end();
                    }
                });
            }

            break;
        }

        case "DELETE": {
            res.setHeader("content-type", "application/json");

            try {
                const file = req.headers?.filename?.toString();
                await rm(`./uploads/${file}`);
                res.end(JSON.stringify({ status: "File Deleted", deleted: file }));
            } catch (error) {
                if (!res.writableEnded) {
                    res.end(JSON.stringify({ status: "Deleted Failed", error: error }));
                }
            }

            break;
        }

        case "PATCH": {
            res.setHeader("content-type", "application/json");
            try {
                const { oldfile, newfile } = req.headers;
                await rename(`./uploads/${oldfile}`, `./uploads/${newfile}`)
                res.end(JSON.stringify({ status: "File Renamed", oldfile: oldfile, newfile: newfile }));
            } catch (error) {
                if (!res.writableEnded) {
                    res.end(JSON.stringify({ status: "Rename Failed", error: error }));
                }
            }

            break;
        }

        default: {
            return res.end("No route found");
        }
    }
});

server.listen(5000, '0.0.0.0', () => {
    console.log("listing server at port: 5000");
})