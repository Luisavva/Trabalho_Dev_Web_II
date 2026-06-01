import type { Request, Response, NextFunction } from 'express';

/**
 * Autoriza apenas usuários cujo papel esteja na lista informada.
 * Deve ser usado APÓS o middleware authenticate.
 *
 * Ex.: router.post('/', authenticate, authorize('ADMIN'), handler)
 */
export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Acesso negado: permissão insuficiente' });
    }
    return next();
  };
}
