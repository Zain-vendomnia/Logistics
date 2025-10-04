import { Request, Response, NextFunction } from "express";
import config from "../config";
import jwt from "jsonwebtoken";

const validateToken = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const headerToken = req.headers["authorization"];

  if (headerToken !== undefined && headerToken?.startsWith("Bearer ")) {
    const bearerToken = headerToken.slice(7);
    try {
      await jwt.verify(bearerToken, config.SECRET);
      return next();
    } catch (error) {
      return res.status(400).json({ message: "Token Invalid" });
    }
  } else {
    return res.status(401).json({ message: "Access denied no token provided" });
  }
};

export default validateToken;
