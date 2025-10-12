import express from "express";
import { body, param } from "express-validator"
import { validator } from "../middleware/ExpressValidator.js"
import { createFile, readFile, updateFile, deleteFile } from "../controllers/imageController.js"

const router = express.Router()

// Route 1: Add file to the server
// router.post("/", [
//     body("filename").isString().trim().escape(),
// ], validator, createFile);
router.post("/", createFile);

// Route 2: Get file from server
router.get("/:filename", [
    param("filename").isString().trim().escape(),
], validator, readFile);

// Route 3: Update the target file
router.put("/", [
    body("filename").isString().trim().escape(),
    body("newname").isString().trim().escape(),
], validator, updateFile);

// Route 4: Delete target file
router.delete("/:filename", [
    param("filename").isString().trim().escape(),
], validator, deleteFile);

export default router
