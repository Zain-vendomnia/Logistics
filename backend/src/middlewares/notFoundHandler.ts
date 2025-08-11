import { Request, Response } from "express";

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    message: `Oops! Route [${req.method}] ${req.originalUrl} not found on this server.`,
    suggestion: "Check your URL or method type (GET, POST, etc.)",
  });
};
