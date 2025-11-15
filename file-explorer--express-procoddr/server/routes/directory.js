import express from "express";
import { handleRead, handleCreate } from "../controllers/directory.js";

export const directoryRoutes = express.Router();

/**
 * @swagger
 * /api/v1/dir:
 *   get:
 *     summary: Get root directory contents
 *     description: Returns information about all files and folders in the root uploads directory
 *     tags:
 *       - Directory
 *     responses:
 *       200:
 *         description: Root directory contents listed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/FileItem"
 *       500:
 *         description: Server error while reading directory
 */

/**
 * @swagger
 * /api/v1/dir/{fullpath}:
 *   get:
 *     summary: Read a directory's contents
 *     description: Returns information about all files and subdirectories inside a given directory path
 *     tags:
 *       - Directory
 *     parameters:
 *       - in: path
 *         name: fullpath
 *         required: true
 *         schema:
 *           type: string
 *         description: Directory path (e.g., "documents" or "documents/subfolder")
 *     responses:
 *       200:
 *         description: Directory contents listed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/components/schemas/FileItem"
 *       404:
 *         description: Directory not found
 *       500:
 *         description: Server error while reading directory
 */

/**
 * @swagger
 * /api/v1/dir:
 *   post:
 *     summary: Create a new directory
 *     description: Create a new folder in the specified location
 *     tags:
 *       - Directory
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateDirInput"
 *     responses:
 *       200:
 *         description: Directory created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "Directory Created"
 *                 stats:
 *                   type: object
 *                   properties:
 *                     file:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [dir]
 *                     target:
 *                       type: string
 *       400:
 *         description: Invalid input - name is required
 *       500:
 *         description: Directory creation failed
 */

// Directory routes
directoryRoutes.get("/", handleRead);
directoryRoutes.get("/*fullpath", handleRead);
directoryRoutes.post("/", handleCreate);

