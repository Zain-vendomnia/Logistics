import winston from "winston";
import { emitLogging } from "./socket";

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = winston.createLogger({
  level: "silly",
  format: winston.format.combine(
    winston.format.colorize({ all: true }),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
      handleExceptions: true,
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
      handleExceptions: true,
    }),
  ],
  exitOnError: false,
}) as winston.Logger;

const levels: (keyof winston.Logger)[] = [
  "info",
  "warn",
  "error",
  "debug",
  "verbose",
  "silly",
];

levels.forEach((level) => {
  const original = (logger as any)[level];
  (logger as any)[level] = (message: string) => {
    original.call(logger, message);
    emitLogging(`[${level.toString().toUpperCase()}] ${message}`);
  };
});

export default logger;
