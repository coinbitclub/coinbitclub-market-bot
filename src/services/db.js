// src/services/db.js
import {
  pool,
  getUserByEmail,
  getUserById,
  getBinanceCredentials,
  getBybitCredentials,
  saveBinanceCredentials,
  saveBybitCredentials,
  getUserOperations,
  createPasswordResetToken,
  getPasswordResetToken,
  deletePasswordResetToken,
  createEmailConfirmationToken,
  confirmUserEmail
} from '../database.js';

export {
  pool,
  getUserByEmail,
  getUserById,
  getBinanceCredentials,
  getBybitCredentials,
  saveBinanceCredentials,
  saveBybitCredentials,
  getUserOperations,
  createPasswordResetToken,
  getPasswordResetToken,
  deletePasswordResetToken,
  createEmailConfirmationToken,
  confirmUserEmail
};
