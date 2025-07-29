import { createReadStream, createWriteStream } from "fs";

const readStream = createReadStream(
  "C:\\Users\\Shivam Kashyap\\Desktop\\Node Learning\\streaming\\writeablestream\\video-file.mkv",
  {
    highWaterMark: 1 * 1024 * 1024,
  }
);

const writeStream = createWriteStream("copied.mkv", {
  highWaterMark: 1 * 1024 * 1024,
});

console.time("Copy time");
// readStream.on("data", (chunk) => {
//   const isEmpty = writeStream.write(chunk);
//   if (!isEmpty) {
//     readStream.pause();
//   }
// });

// writeStream.on("drain", () => {
//   readStream.resume();
// });

// Below code is equivalent to able commented code
readStream.pipe(writeStream);

readStream.on("end", () => {
  console.timeEnd("Copy time");
  writeStream.close();
});

writeStream.on("finish", () => {
  console.log("File copying done");
});
