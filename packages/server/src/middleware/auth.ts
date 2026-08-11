import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";

export interface AuthRequest extends Request {
  adminId?: string;
  username?: string;
}

export const generateToken = (adminId: string, username: string): string => {
  return jwt.sign({ adminId, username }, JWT_SECRET, {
    expiresIn: "7d", // Token expires in 7 days
  });
};

/**
 * Is this request from a signed-in admin? Unlike verifyToken this never
 * rejects — it's for endpoints that serve everyone but reveal more to admins.
 */
export const isAdminRequest = (req: Request): boolean => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return false;
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch {
    return false;
  }
};

export const verifyToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    // Get token from header
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as {
      adminId: string;
      username: string;
    };

    // Add admin info to request
    req.adminId = decoded.adminId;
    req.username = decoded.username;

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};
