import { cleanEnv, str, num } from "envalid";
import { config } from "dotenv";
config();

const env = cleanEnv(process.env, {
  CORS_ORIGIN: str(),
  COOKIE_SECRET: str(),
  NODE_ENV: str({ choices: ["development", "production", "test"] }),
  PORT: num(),
  PADDLE_WEBHOOK_SECRET: str(),
  JWT_ACCESS_SECRET: str(),
  RATE_LIMIT_WINDOW_MS: num(),
  RATE_LIMIT_MAX_REQUESTS: num(),
  BCRYPT_SALT_ROUNDS: num(),
  SMTP_HOST: str(),
  SMTP_PORT: num(),
  SMTP_USER: str(),
  SMTP_PASS: str(),
  SMTP_FROM: str(),
  DASHBOARD_URL: str(),
  PADDLE_ENV: str({ default: "sandbox" }),
  PADDLE_API_KEY: str(),
  DATABASE_URL: str()
});

export const CORS_ORIGIN = env.CORS_ORIGIN;
export const COOKIE_SECRET = env.COOKIE_SECRET;
export const NODE_ENV = env.NODE_ENV;
export const PORT = env.PORT;
export const PADDLE_WEBHOOK_SECRET = env.PADDLE_WEBHOOK_SECRET;
export const JWT_ACCESS_SECRET = env.JWT_ACCESS_SECRET;
export const RATE_LIMIT_WINDOW_MS = env.RATE_LIMIT_WINDOW_MS;
export const RATE_LIMIT_MAX_REQUESTS = env.RATE_LIMIT_MAX_REQUESTS;
export const BCRYPT_SALT_ROUNDS = env.BCRYPT_SALT_ROUNDS;
export const SMTP_HOST = env.SMTP_HOST;
export const SMTP_PORT = env.SMTP_PORT;
export const SMTP_USER = env.SMTP_USER;
export const SMTP_PASS = env.SMTP_PASS;
export const SMTP_FROM = env.SMTP_FROM;
export const DASHBOARD_URL = env.DASHBOARD_URL;
export const PADDLE_ENV = env.PADDLE_ENV;
export const PADDLE_API_KEY = env.PADDLE_API_KEY;
export const DATABASE_URL = env.DATABASE_URL;
export const PLAN_NAME_MAP: Record<string, string> = {
  starter: 'STARTER',
  pro: 'PRO',
  advanced: 'ADVANCED',
};