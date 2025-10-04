import express from "express";
import { createFile, readFile, updateFile, deleteFile } from "../controllers/imageController.js"

const router = express.Router()

router.post("/", createFile);
router.get("/:file", readFile);
router.put("/", updateFile);
router.delete("/:file", deleteFile);

export default router