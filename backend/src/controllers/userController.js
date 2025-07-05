// src/controllers/userController.js
const userService = require('../services/userService');

// … controllers existentes …

exports.getRisks = async (req, res) => {
  try {
    const data = await userService.getRisks(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRisks = async (req, res) => {
  try {
    await userService.updateRisks(req.user.id, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getSignals = async (req, res) => {
  try {
    const signals = await userService.getSignals(req.user.id);
    res.json(signals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.requestWithdrawal = async (req, res) => {
  try {
    await userService.requestWithdrawal(req.user.id, req.body.amount);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
