import { open, readdir } from 'fs/promises';
import http from 'http'

const server = http.createServer(async (req, res) => {
    if (req.url === "/") {
        const items = await readdir("./storage/images");

        let dynamicHTML = ""
        items.forEach((item) => dynamicHTML += `<li> <a href="${item}"> ${item} </a></li>`);

        res.end(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Document</title>
            </head>
            <body>
                <h1>My files</h1>
                <ul> ${dynamicHTML} </ul>
            </body>
            </html>
        `);
    } else {
        try {
            const file = await open(`./storage/images/${req.url}`);
            const readStream = file.createReadStream()
            readStream.pipe(res);
        } catch (error) {
            res.end(error?.message || "ERROR_AT_LN:34");
        }
    }
});

server.listen(80, '0.0.0.0', () => {
    console.log("listing server at port: 8080");
})