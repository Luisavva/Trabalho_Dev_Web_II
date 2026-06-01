import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { hashPassword } from '../lib/auth';
import { asyncHandler, safeUserSelect } from '../lib/http';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { updateUserSchema, updateRoleSchema } from '../schemas/user.schema';

export const usersRouter = Router();

// Todas as rotas de usuário exigem autenticação.
usersRouter.use(authenticate);

/**
 * GET /users  — somente ADMIN.
 * Lista todos os usuários (sem expor senhas).
 */
usersRouter.get(
  '/',
  authorize('ADMIN'),
  asyncHandler(async (_req, res) => {
    const users = await prisma.user.findMany({
      select: safeUserSelect,
      orderBy: { createdAt: 'desc' },
    });
    return res.status(200).json(users);
  }),
);

/**
 * GET /users/:id — usuário autenticado.
 */
usersRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: safeUserSelect,
    });
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    return res.status(200).json(user);
  }),
);

/**
 * PATCH /users/:id — controle de propriedade.
 * Apenas o próprio usuário (ou um ADMIN) pode atualizar a conta.
 */
usersRouter.patch(
  '/:id',
  validate(updateUserSchema),
  asyncHandler(async (req, res) => {
    const targetId = req.params.id;
    const isSelf = req.user!.id === targetId;
    const isAdmin = req.user!.role === 'ADMIN';
    if (!isSelf && !isAdmin) {
      return res.status(403).json({ error: 'Você só pode editar a própria conta' });
    }

    const target = await prisma.user.findUnique({ where: { id: targetId } });
    if (!target) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (email && email !== target.email) {
      const taken = await prisma.user.findUnique({ where: { email } });
      if (taken) {
        return res.status(409).json({ error: 'E-mail já cadastrado' });
      }
    }

    const user = await prisma.user.update({
      where: { id: targetId },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(password !== undefined ? { password: await hashPassword(password) } : {}),
      },
      select: safeUserSelect,
    });
    return res.status(200).json(user);
  }),
);

/**
 * PATCH /users/:id/role — somente ADMIN.
 * Permite promover/rebaixar um usuário.
 */
usersRouter.patch(
  '/:id/role',
  authorize('ADMIN'),
  validate(updateRoleSchema),
  asyncHandler(async (req, res) => {
    const exists = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { role: req.body.role },
      select: safeUserSelect,
    });
    return res.status(200).json(user);
  }),
);

/**
 * DELETE /users/:id — somente ADMIN.
 */
usersRouter.delete(
  '/:id',
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const exists = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }
    await prisma.user.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  }),
);
