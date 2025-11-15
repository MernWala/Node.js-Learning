import express from "express";
import { handleRead, handleCreate, handleUpdate, handleDelete } from "../controllers/files.js";

export const fileRoutes = express.Router();

/**
 * @swagger
 * /api/v1/files:
 *   get:
 *     summary: Get root directory contents
 *     description: Returns information about all files and folders in the root uploads directory
 *     tags:
 *       - Files
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
 * /api/v1/files/{filepath}:
 *   get:
 *     summary: Get file or directory contents
 *     description: Returns information about a specific file or directory. If it's a directory, returns its contents. If it's a file, serves the file (download if action=download is set)
 *     tags:
 *       - Files
 *     parameters:
 *       - in: path
 *         name: filepath
 *         required: true
 *         schema:
 *           type: string
 *         description: Path to file or directory (e.g., "documents/file.txt" or "documents")
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *           enum: [download]
 *         description: Set to "download" to download the file instead of viewing it
 *     responses:
 *       200:
 *         description: File/directory served successfully
 *       404:
 *         description: File or directory not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/v1/files:
 *   post:
 *     summary: Upload a file
 *     description: Upload a file to the specified directory. The filename and path must be provided in headers
 *     tags:
 *       - Files
 *     parameters:
 *       - in: header
 *         name: filename
 *         required: true
 *         schema:
 *           type: string
 *         description: Name of the file to upload (e.g., "document.pdf")
 *       - in: header
 *         name: path
 *         schema:
 *           type: string
 *         description: Target directory path (e.g., "documents" or empty string for root)
 *     requestBody:
 *       required: true
 *       content:
 *         application/octet-stream:
 *           schema:
 *             type: string
 *             format: binary
 *       description: File content as binary data
 *     responses:
 *       200:
 *         description: File uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "Upload Finish"
 *                 file:
 *                   $ref: "#/components/schemas/FileItem"
 *       400:
 *         description: No filename found in headers
 *       500:
 *         description: Upload failed
 */

/**
 * @swagger
 * /api/v1/files:
 *   patch:
 *     summary: Rename a file or folder
 *     description: Rename an existing file or directory using headers oldpath and newpath
 *     tags:
 *       - Files
 *     parameters:
 *       - in: header
 *         name: oldpath
 *         required: true
 *         schema:
 *           type: string
 *         description: Current path of the file/folder (e.g., "documents/oldname.txt")
 *       - in: header
 *         name: newpath
 *         required: true
 *         schema:
 *           type: string
 *         description: New path for the file/folder (e.g., "documents/newname.txt")
 *     responses:
 *       200:
 *         description: File/Folder renamed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "File renamed succesfully"
 *                 stats:
 *                   type: object
 *                   properties:
 *                     file:
 *                       type: string
 *                     type:
 *                       type: string
 *                       enum: [file, dir]
 *                     path:
 *                       type: string
 *                     oldname:
 *                       type: string
 *       500:
 *         description: Rename error
 */

/**
 * @swagger
 * /api/v1/files/{filepath}:
 *   delete:
 *     summary: Delete a file or directory
 *     description: Delete a file or directory. For directories, uses recursive deletion
 *     tags:
 *       - Files
 *     parameters:
 *       - in: path
 *         name: filepath
 *         required: true
 *         schema:
 *           type: string
 *         description: Path to file or directory to delete (e.g., "documents/file.txt")
 *       - in: header
 *         name: filetype
 *         required: true
 *         schema:
 *           type: string
 *           enum: [file, dir]
 *         description: Type of item being deleted - "file" or "dir"
 *     responses:
 *       200:
 *         description: File/Directory deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "File Deleted"
 *                 deleted:
 *                   type: string
 *       500:
 *         description: Delete error
 */

// Read files
fileRoutes.get("/", handleRead);
fileRoutes.get("/*filepath", handleRead);

// CRUD
fileRoutes.post("/", handleCreate);
fileRoutes.patch("/", handleUpdate);    // -> File & folder rename both handled
fileRoutes.delete("/*filepath", handleDelete);
