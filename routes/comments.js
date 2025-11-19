import express from "express";
import {
  getCommentsForTweet,
  createComment,
  deleteComment,
  likeComment,
} from "../controllers/commentController.js";

const router = express.Router();

router.get("/tweet/:tweetId", getCommentsForTweet);
router.post("/", createComment);
router.delete("/:commentId", deleteComment);
router.put("/:commentId/like", likeComment);

export default router;
