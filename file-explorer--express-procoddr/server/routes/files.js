import express from "express";
import { handleRead, handleCreate, handleUpdate, handleDelete } from "../controllers/files.js";
import { handleRead as handleReadDirectory, handleCreate as handleCreateDirectory } from "../controllers/directory.js";

const router = express.Router();

// Directory routes
router.get("/dir/*fullpath", handleReadDirectory);
router.post("/dir", handleCreateDirectory);

// Read files
router.get("/", handleRead);
router.get("/*filepath", handleRead);

// CRUD
router.post("/", handleCreate);
router.patch("/", handleUpdate);    // -> File & folder rename both handled
router.delete("/*filepath", handleDelete);

export default router;
