/*
  Complaxity:
  Time: 4.5s
  Memory: 800-900mb
  CPU: 20%

  By default write-stream internal buffer size is: 16KB
  By default read-stream internal buffer size is: 64KB
*/

import { createReadStream, createWriteStream } from "fs";

const readStream = createReadStream("./video-file.mkv");
const writeStream = createWriteStream("./test.mkv");

console.time();
readStream.on("data", async (chunk) => {
  const isEmpty = writeStream.write(chunk);
  if (!isEmpty) {
    readStream.pause();
  }
});

writeStream.on("drain", () => {
  readStream.resume();
});

readStream.on("end", () => {
  writeStream.close();
});

writeStream.on("finish", () => {
  console.timeEnd();
  console.log("File copy done");
});
