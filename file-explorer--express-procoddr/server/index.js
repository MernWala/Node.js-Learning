import express from "express";
import { config } from "./config.js";
import cors from "cors";
import fileRoute from "./routes/files.js";

const app = express();

app.use(cors({}));
app.use(express.json());

app.use("/files", fileRoute);

app.listen(config.port, () => {
    console.log(`Server is running at PORT: ${config.port}`);
});
