import { PrismaClient } from "@prisma/client";
import { DATABASE_URL } from "./constants";

const prisma  = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL,
    },
  },
});
export default prisma;
