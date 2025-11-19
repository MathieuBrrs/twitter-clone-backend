
import express from "express";
import { updateProfileInfo } from "../controllers/profileController.js";

const router = express.Router();



router.put("/", updateProfileInfo);

export default router;
