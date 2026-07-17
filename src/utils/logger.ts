import winston from "winston";
import { NODE_ENV } from "../constants/constants";

const { combine, timestamp, printf, colorize, errors, json } = winston.format;

const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaString = Object.keys(meta).length
    ? `\nMETA: ${JSON.stringify(meta, null, 2)}`
    : "";

  return `[${timestamp}] [${level}] ${stack || message}${metaString}`;
});

const logger = winston.createLogger({
  level: NODE_ENV === "production" ? "info" : "debug",
  format: combine(
    errors({ stack: true }),
    timestamp(),
    NODE_ENV === "production" ? json() : devFormat
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize({ all: true }),
        timestamp(),
        devFormat
      ),
    }),
  ],
});
logger.add(
  new winston.transports.File({
    filename: "logs/error.log",
    level: "error",
  })
);

logger.add(
  new winston.transports.File({
    filename: "logs/combined.log",
  })
);

export default logger;