// src/routes/authRoutes.js
import { Router } from "express";
import authRouter from "./auth.js";

const router = Router();

// all auth-related routes mounted here
router.use("/", authRouter);

export default router;
