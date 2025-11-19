import express from "express";
import { getUserProfile } from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:id", authenticateToken, getUserProfile);

export default router;
