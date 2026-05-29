import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const N8N_INTERNAL_KEY = process.env.N8N_INTERNAL_KEY || 'super-secret-key';

export const authenticate = (req: any, res: Response, next: NextFunction) => {
  const n8nApiKey = req.headers['x-n8n-api-key'];
  if (n8nApiKey && n8nApiKey === N8N_INTERNAL_KEY) {
    console.log('✅ Authentification n8n réussie !');
    req.userId = 'n8n-system-user'; 
    return next(); // On s'arrête ici et on passe à la route
  }

  const token = req.cookies?.whaazz_token; 

  if (!token) {
    console.log('❌ Échec : Aucun token ni clé n8n valide.');
    return res.status(401).json({ error: "Accès refusé. Token ou clé API manquante." });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    req.userId = decoded.userId; 
    next();
  } catch (error) {
    res.status(401).json({ error: "Token invalide ou expiré." });
  }
};