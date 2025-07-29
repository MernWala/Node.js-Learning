import { createReadStream } from "fs";
import { appendFile, stat } from "fs/promises";

const options = {
  highWaterMark: 64 * 1024,
};

const getOperationPercentage = async (path, counter) => {
  const statData = await stat(path);
  const totalSize = statData.size;

  const percent = (counter / totalSize) * 100;

  process.stdout.clearLine(0);
  process.stdout.cursorTo(0);
  process.stdout.write(`📦 ${percent.toFixed(2)}% Completed`);

  return percent;
};

if (process.argv.length > 2) {
  const path = process.argv?.[2];
  const extention = path.split(".")[path.split(".").length - 1];
  const copiedName = process.argv?.[3] ?? `temp.${extention}`;

  const readStream = createReadStream(path, options);

  let counter = 0;
  readStream.on("data", async (chunk) => {
    counter += chunk.length;
    await appendFile(copiedName, chunk);
    await getOperationPercentage("video-file.mkv", counter);
  });
} else {
  console.log("Pass file-path & copied-file-name in argument");
}
