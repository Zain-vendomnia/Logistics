import { Request, Response, NextFunction } from "express";
import logger from "../config/logger";

interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : "Internal Server Error";
  if (process.env.NODE_ENV === "development") {
    logger.warn("Development Environment:", err);
  } else {
    logger.warn("Production Environment:", err);
    // In production, log the error to a file or monitoring service
    // logError(err);
  }

  logger.error(
    `[${_req.method}] ${_req.originalUrl} - ${message} [${statusCode}]`
  );

  res.status(statusCode).json({
    success: false,
    message,
  });
};
