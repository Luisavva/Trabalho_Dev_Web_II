import type { Request, Response, NextFunction } from 'express';

/** Responde 404 para rotas não mapeadas. */
export function notFound(_req: Request, res: Response) {
  res.status(404).json({ error: 'Rota não encontrada' });
}

/**
 * Middleware global de erros. Captura exceções lançadas nos handlers
 * (encaminhadas pelo asyncHandler) e responde com JSON.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (process.env.NODE_ENV !== 'test') {
    console.error(err);
  }
  res.status(500).json({ error: 'Erro interno do servidor' });
}
