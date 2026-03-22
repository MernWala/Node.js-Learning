import express from "express";
import { FileController } from "../controllers/FileController.js";


export const FileRoutes = () => {
    const router = express.Router();
    const fileController = new FileController();

    router.post("/", fileController.create.bind(fileController));
    router.get("/:id", fileController.read.bind(fileController));
    router.patch("/", fileController.rename.bind(fileController));
    router.patch("/move", fileController.move.bind(fileController));
    router.delete("/:id", fileController.delete.bind(fileController));

    return router;
}