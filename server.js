import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import tweetsRoutes from "./routes/tweets.js";
import profileRoutes from "./routes/profile.js";
import commentsRoutes from "./routes/comments.js";
import { authenticateToken } from "./middleware/authMiddleware.js";
import { initDb } from "./initDb.js";
dotenv.config();

import express from "express";
import cors from "cors";
const allowedOrigin = process.env.FRONTEND_URL;

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: allowedOrigin,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

//routes
app.use("/api/auth", authRoutes);
app.use(authenticateToken);
app.use("/api/users", userRoutes);
app.use("/api/tweets", tweetsRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/comments", commentsRoutes);

const PORT = process.env.PORT || 5000;
async function startServer() {
  try {
    await initDb();
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  } catch (err) {
    console.error("Failed to initialize database or start server:", err);
    process.exit(1);
  }
}

startServer();
