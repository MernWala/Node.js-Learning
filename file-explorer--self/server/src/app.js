import express from "express";
import cors from "cors";
import helmet from "helmet";
import { corsOptions } from "./config.js";
import { Auth } from "./routes/auth.js"
// import ImageRoutes from "./routes/image.js";
// import AudioRoutes from "./routes/audio.js";
// import VideoRoutes from "./routes/video.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(cors(corsOptions));
app.use(helmet());


// Authentication route => Login, Register, Account Recovery
app.use("/auth", authRoute);

// GET route gate - 1
app.get("/", (req, res) => {

});

// POST route gate - 1
app.post("/", (req, res) => {

});

// PATCH route gate - 1
app.patch("/", (req, res) => {

});

// DELETE route gate - 1
app.delete("/", (req, res) => {

});

export default app;
