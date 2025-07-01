import express from "express";
import * as notificationService from "../services/notificationService.js";

const router = express.Router();

// Envia notificação manual
router.post("/send", async (req, res, next) => {
  try {
    const result = await notificationService.sendNotification(req.body);
    res.json(result);
  } catch (err) { next(err); }
});

// Lista notificações do usuário (precisa de JWT futuramente)
router.get("/", async (req, res, next) => {
  try {
    const { userId } = req.query;
    const notes = await notificationService.getUserNotifications(userId);
    res.json(notes);
  } catch (err) { next(err); }
});

export default router;
