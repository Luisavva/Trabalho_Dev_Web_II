import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword, signToken } from '../lib/auth';
import { asyncHandler, safeUserSelect } from '../lib/http';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { registerSchema, loginSchema } from '../schemas/auth.schema';

export const authRouter = Router();

/**
 * POST /auth/register
 * Cria uma conta nova. A senha é armazenada como hash bcrypt.
 */
authRouter.post(
  '/register',
  validate(registerSchema),
  asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'E-mail já cadastrado' });
    }

    const user = await prisma.user.create({
      data: { name, email, password: await hashPassword(password) },
      select: safeUserSelect,
    });

    const token = signToken({ sub: user.id, role: user.role });
    return res.status(201).json({ user, token });
  }),
);

/**
 * POST /auth/login
 * Valida credenciais e devolve um JWT.
 */
authRouter.post(
  '/login',
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(password, user.password))) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = signToken({ sub: user.id, role: user.role });
    return res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    });
  }),
);

/**
 * GET /auth/me
 * Retorna os dados do usuário autenticado.
 */
authRouter.get(
  '/me',
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: safeUserSelect,
    });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    return res.status(200).json(user);
  }),
);
