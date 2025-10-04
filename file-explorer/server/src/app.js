import express from "express";
import cors from "cors";
import helmet from "helmet";
import { corsOptions } from "./config.js";
import ImageRoutes from "./routes/image.js";
import AudioRoutes from "./routes/audio.js";
import VideoRoutes from "./routes/video.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors(corsOptions));
app.use(helmet());

// Routes
app.use("/api/image", ImageRoutes);
app.use("/api/audio", AudioRoutes);
app.use("/api/video", VideoRoutes);

export default app;
