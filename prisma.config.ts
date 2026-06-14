import path from "node:path";
import type { PrismaConfig } from "prisma";
import "dotenv/config";

export default {
  schema: path.join("src/models"),
  datasource: {
    url: process.env.DATABASE_URL!,
  },
} satisfies PrismaConfig;