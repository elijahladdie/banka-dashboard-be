import { cleanEnv, str, num, url } from "envalid";
import { config } from "dotenv";
import { Environment } from "@paddle/paddle-node-sdk";
config();

const env = cleanEnv(process.env, {
  CORS_ORIGIN: str(),
  COOKIE_SECRET: str(),
  NODE_ENV: str({ choices: ["development", "production", "test"] }),
  PORT: num(),
  PADDLE_CREATION_WEBHOOK_SECRET: str(),
  PADDLE_SUBSCRIPTION_WEBHOOK_SECRET: str(),
  JWT_ACCESS_SECRET: str(),
  PADDLE_API_ENV: str({ choices: ["sandbox", "production"], default: "sandbox" }),
  RATE_LIMIT_WINDOW_MS: num(),
  RATE_LIMIT_MAX_REQUESTS: num(),
  BCRYPT_SALT_ROUNDS: num(),
  SMTP_HOST: str(),
  SMTP_PORT: num(),
  SMTP_USER: str(),
  SMTP_PASS: str(),
  SMTP_FROM: str(),
  DASHBOARD_URL: str(),
  PADDLE_URL: url({ default: "sandbox" }),
  PADDLE_API_KEY: str(),
  DATABASE_URL: str()
});

export const CORS_ORIGIN = env.CORS_ORIGIN;
export const COOKIE_SECRET = env.COOKIE_SECRET;
export const NODE_ENV = env.NODE_ENV;
export const PORT = env.PORT;
export const PADDLE_CREATION_WEBHOOK_SECRET = env.PADDLE_CREATION_WEBHOOK_SECRET;
export const PADDLE_SUBSCRIPTION_WEBHOOK_SECRET = env.PADDLE_SUBSCRIPTION_WEBHOOK_SECRET;
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
export const PADDLE_URL = env.PADDLE_URL;
export const PADDLE_API_KEY = env.PADDLE_API_KEY;
export const PADDLE_API_ENV = env.PADDLE_API_ENV as Environment;
export const DATABASE_URL = env.DATABASE_URL;
export const PLAN_NAME_MAP: Record<string, string> = {
  starter: 'STARTER',
  pro: 'PRO',
  advanced: 'ADVANCED',
};
export  const SUBSCRIPTION_RANK: Record<string, number> = {
      'starter:month': 1,
      'starter:year': 2,

      'pro:month': 3,
      'pro:year': 4,

      'advanced:month': 5,
      'advanced:year': 6,
    };
    
export const PLAN_FEATURES: Record<string, any>[] = [
  {
    name: "Starter",
    title: "💰 RWF 10,000/month • RWF 100,000/year",
    subtitle: "Personal Banking Agent",
    features: [
      "Personal budget planning",
      "Savings and investment goal tracking",
      "Loan readiness assessment",
      "Digital banking support",
      "Monthly financial health reports",
      "Credit improvement recommendations",
      "Dedicated financial advisor",
    ],
  },
  {
    name: "Pro",
    title: "💰 RWF 50,000/month • RWF 500,000/year",
    subtitle:
      "Business Advisor • Includes everything in Starter, plus:",
    features: [
      "Dedicated SME advisor",
      "Cash flow analysis and forecasting",
      "Business performance monitoring",
      "Tax and compliance guidance",
      "Financing and grant opportunity alerts",
      "Quarterly strategy reviews",
      "Business plan assessment",
      "Financial reporting support",
    ],
  },
  {
    name: "Advanced",
    title: "💰 RWF 100,000/month • RWF 1,000,000/year",
    subtitle:
      "Investor Outreach Personnel • Includes everything in Pro and Starter, plus:",
    features: [
      "Investment readiness assessment",
      "Investor matching services",
      "Pitch deck development support",
      "Fundraising strategy consultations",
      "Investor introductions",
      "Quarterly investor roadshows",
      "Market intelligence reports",
      "ESG and impact reporting support",
    ],
  },
];