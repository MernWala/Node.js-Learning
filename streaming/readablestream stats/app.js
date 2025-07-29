import { createReadStream } from "fs";
import { appendFile, writeFile } from "fs/promises";

const readStream = createReadStream("./chars.txt", {
  highWaterMark: 1,
});

readStream.on("data", async (chunk) => {
  readStream.pause();
  if (readStream.bytesRead === readStream.readableHighWaterMark) {
    await writeFile("./data.txt", chunk.toString());
  } else {
    await appendFile("./data.txt", chunk.toString());
  }

  setTimeout(async () => {
    readStream.resume();
  }, 100);
});
