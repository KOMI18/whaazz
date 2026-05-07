import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export const authenticate = (req: any, res: Response, next: NextFunction) => {
  const token = req.cookies.whaazz_token;

  if (!token) return res.status(401).json({ error: "Accès refusé. Token manquant." });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId; 
    next();
  } catch (error) {
    res.status(401).json({ error: "Token invalide ou expiré." });
  }
};