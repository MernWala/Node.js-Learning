import { readFile, writeFile } from "node:fs/promises"

// reading data and returing buffer
const buffer = await readFile('./image.jpg')

// using buffer and creating another file
await writeFile('test.jpg', buffer)
