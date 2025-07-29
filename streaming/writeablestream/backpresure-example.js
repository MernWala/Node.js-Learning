/*
  Complaxity:
  Time: 4.5s
  Memory: 800-900mb
  CPU: 20%

  By default write-stream internal buffer size is: 16KB
  By default read-stream internal buffer size is: 64KB

  After applying backpresure
  ------------------------------
  Time: 4s
  Memory: 15-30 mb
  CPU: 18-21 %
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
  console.timeEnd();
});
