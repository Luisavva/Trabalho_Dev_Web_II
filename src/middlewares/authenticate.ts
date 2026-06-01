import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../lib/auth';

/**
 * Exige um JWT válido no header Authorization: "Bearer <token>".
 * Em caso de falha responde 401 e injeta req.user em caso de sucesso.
 */
export function authenticate(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = header.slice('Bearer '.length).trim();
  try {
    const payload = verifyToken(token);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}
