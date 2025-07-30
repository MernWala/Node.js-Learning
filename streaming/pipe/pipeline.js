import { createReadStream, createWriteStream } from "fs";
import { pipeline } from "stream";

const readStream = createReadStream(
  "C:\\Users\\Shivam Kashyap\\Desktop\\Node Learning\\streaming\\writeablestream\\video-file.mkv",
  {
    highWaterMark: 1 * 1024 * 1024,
  }
);

const writeStream = createWriteStream("copied.mkv", {
  highWaterMark: 1 * 1024 * 1024,
});

// readStream.pipe(writeStream);
// better way to use pipe -> We can handle error too here
pipeline(readStream, writeStream, (err) => {
  console.log(err);
});

readStream.on("end", () => {
  console.timeEnd("Copy time");
  writeStream.close();
});

writeStream.on("finish", () => {
  console.log("File copying done");
});
