import express, { Request, Response } from "express";
import { config } from "./config.js";
import cors from "cors";
import { FileRoutes } from "./routes/files.js";
import { DirectoryRoutes } from "./routes/directory.js";
import { swaggerUi, swaggerSpec } from "./swagger.js";
import { AppLogger } from "./util/AppLogger.js";

const app = express();
const version = "v2";

app.use(cors({}));
app.use(express.json());

const logger = new AppLogger("./src/index.ts");

app.get("/health", (req: Request, res: Response) => {
    return res.json({
        success: true,
        error: null,
        message: "Server is running",
        payload: null,
        status: 200,
    })
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use(`/api/${version}/dir/`, DirectoryRoutes());
app.use(`/api/${version}/file/`, FileRoutes());

app.listen(config.port, () => {
    logger.info(`Server is running at PORT: ${config.port}`);
    console.log(`Server is running at PORT: ${config.port}`);
});
