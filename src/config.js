import dotenv from 'dotenv';
dotenv.config();

export const PORT = process.env.PORT || 8080;
export const DATABASE_URL = process.env.DATABASE_URL;
export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_EXPIRATION = process.env.JWT_EXPIRATION || '1h';
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
export const STRIPE_SUCCESS_URL = process.env.STRIPE_SUCCESS_URL;
export const STRIPE_CANCEL_URL = process.env.STRIPE_CANCEL_URL;
