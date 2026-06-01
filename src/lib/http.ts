import type { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Envolve handlers assíncronos para encaminhar erros ao middleware de erro
 * (do contrário promessas rejeitadas não seriam capturadas pelo Express 4).
 */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => {
    fn(req, res, next).catch(next);
  };

/**
 * Campos do usuário seguros para retornar em respostas.
 * Garante que a senha (hash) NUNCA seja exposta.
 */
export const safeUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;
