import { Request, Response, NextFunction } from "express";

// You can also move these to .env for better security
const SHOPWARE_USERNAME = process.env.SHOPWARE_ORDER_SYNC_USER || "shopwareuser";
const SHOPWARE_PASSWORD = process.env.SHOPWARE_ORDER_SYNC_PASSWORD || "supersecret";

/**
 * Middleware for Basic Authentication for Shopware integration.
 * Expects: Authorization: Basic base64(username:password)
*/
export const shopwareAuth = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Basic ")) {
    return res
      .status(401)
      .json({ message: "Missing or invalid authorization header" });
  }

  const base64Credentials = authHeader.split(" ")[1];
  const credentials = Buffer.from(base64Credentials, "base64")
    .toString("utf-8")
    .split(":");

  const [username, password] = credentials;

  if (username === SHOPWARE_USERNAME && password === SHOPWARE_PASSWORD) {
    return next();
  }

  return res.status(403).json({ message: "Unauthorized access" });
};
