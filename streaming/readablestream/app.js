import { createReadStream } from "fs";
import { appendFile, readFile } from "fs/promises";

// // Example: Read buffer
// console.time()
// const data = await readFile("./video-file.mkv")
// console.timeEnd()

// Example 1
const readStream = createReadStream("./video-file.mkv", {
  // 100 mb
  highWaterMark: 10 * 1024 * 1024,
});

readStream.on("data", async (chunkBuffer) => {
  await appendFile("./temp.mkv", chunkBuffer);
});

// Example 2
const readStream2 = createReadStream("./chars.txt", {
  highWaterMark: 4,
});

readStream2.on("data", (chunk) => {
  console.log(chunk.toString());
})

