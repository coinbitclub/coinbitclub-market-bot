import { Router } from "express";
import { createSubscription } from "../controllers/subscriptionController.js";
import { isUser } from "../middleware/auth.js";

const router = Router();

router.post("/", isUser, createSubscription);

export default router;
