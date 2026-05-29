import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const N8N_INTERNAL_KEY = process.env.N8N_INTERNAL_KEY || 'super-secret-key';
export const authenticate = (req: any, res: Response, next: NextFunction) => {
  const n8nApiKey = req.headers['x-n8n-api-key'];

  if (n8nApiKey && n8nApiKey === N8N_INTERNAL_KEY) {
    console.log('N8N_INTERNAL_KEY' + n8nApiKey);
    req.userId = 'n8n-system-user'; 
    next();
    return;
  }
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