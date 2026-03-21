import express from "express";
import { DirectoryController } from "../controllers/DirController";


export const DirectoryRoutes = () => {
    
    const router = express.Router();
    const controller = new DirectoryController();

    router.post("/", controller.create.bind(controller));
    router.patch("/", controller.rename.bind(controller));
    router.patch("/move", controller.move.bind(controller));
    // router.get("/:id", controller.read.bind(controller));
    // router.delete("/:id", controller.delete.bind(controller));

    return router;
}