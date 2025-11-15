import express from "express";
import { config } from "./config.js";
import cors from "cors";
import { fileRoutes } from "./routes/files.js";
import { directoryRoutes } from "./routes/directory.js";
import { swaggerUi, swaggerSpec } from "./swagger.js";

const app = express();

app.use(cors({}));
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/v1/dir/", directoryRoutes);
app.use("/api/v1/files/", fileRoutes);

app.listen(config.port, () => {
    console.log(`Server is running at PORT: ${config.port}`);
});
