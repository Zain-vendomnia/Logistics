import winston from "winston";
import "winston-mongodb";
import { emitLogging } from "../socket/logging.socket";
import config from "./config";

const logFormat = winston.format.printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

const logger = winston.createLogger({
  level: "silly",
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    logFormat
  ),
  transports: [
    new winston.transports.Console({
      handleExceptions: true,
    }),
    // new winston.transports.File({
    //   filename: "logs/error.log",
    //   level: "error",
    //   handleExceptions: true,
    // }),
    // new winston.transports.File({
    //   filename: "logs/combined.log",
    //   handleExceptions: true,
    // }),
    new winston.transports.MongoDB({
      level: "silly",
      db: config.LOGGING_URL,
      // options: { useNewUrlParser: true },
      
      collection: "application_logs",
      storeHost: true, // store hostname of server
      capped: true, // optional: cap collection to limit size
      cappedSize: 10485760, // ~10MB
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
