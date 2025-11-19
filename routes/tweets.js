import express from "express";
import {
  getTweets,
  createTweet,
  deleteTweet,
  getTweetById,
  likeTweet,
} from "../controllers/tweetController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:id", getTweetById);
router.get("/", getTweets);

router.post("/", authenticateToken, createTweet);
router.delete("/:id", authenticateToken, deleteTweet);
router.put("/:id/like", authenticateToken, likeTweet);

export default router;
