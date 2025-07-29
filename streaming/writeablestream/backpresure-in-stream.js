/*
  Complaxity:
  Time: 4.5s
  Memory: 800-900mb
  CPU: 20%

  Need to backpresure: To optimise memory consumption
*/

import { createWriteStream } from "fs";

const writeStream = createWriteStream("./test.txt", {
  highWaterMark: 4,
});

let i = 0;
const write1000a = () => {
  while (i < 1000) {
    // when isEmpty receives false it means it need backpressing
    const isEmpty = writeStream.write("a");
    i++;
    if (!isEmpty) {
      break;
    }
  }
};

write1000a();
writeStream.on("drain", () => {
  write1000a();
});
