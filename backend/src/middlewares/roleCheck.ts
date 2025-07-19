import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// Middleware to check if the user has one of the roles
const roleCheck = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const headerToken = req.headers["authorization"];
    if (!headerToken) {
      return res.status(401).json({ message: "No token provided" });
    }

    const bearerToken = headerToken.slice(7); // Remove "Bearer " from token
    const tokenData = jwt.decode(bearerToken) as jwt.JwtPayload;

    if (tokenData && allowedRoles.includes(tokenData.role)) {
      next(); // If the user's role is valid, proceed
    } else {
      return res.status(403).json({ message: "Access Denied: Insufficient permissions" });
    }
  };
};

export default roleCheck;
