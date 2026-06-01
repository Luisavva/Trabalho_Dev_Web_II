import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler } from '../lib/http';
import { authenticate } from '../middlewares/authenticate';
import { authorize } from '../middlewares/authorize';
import { validate } from '../middlewares/validate';
import { createTagSchema, updateTagSchema } from '../schemas/tag.schema';

export const tagsRouter = Router();

/**
 * GET /tags — rota de LEITURA PÚBLICA (não exige token).
 */
tagsRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const tags = await prisma.tag.findMany({ orderBy: { name: 'asc' } });
    return res.status(200).json(tags);
  }),
);

/**
 * GET /tags/:id — leitura pública.
 */
tagsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const tag = await prisma.tag.findUnique({ where: { id: req.params.id } });
    if (!tag) {
      return res.status(404).json({ error: 'Etiqueta não encontrada' });
    }
    return res.status(200).json(tag);
  }),
);

/**
 * POST /tags — somente ADMIN.
 */
tagsRouter.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createTagSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.tag.findUnique({ where: { name: req.body.name } });
    if (existing) {
      return res.status(409).json({ error: 'Etiqueta já existe' });
    }
    const tag = await prisma.tag.create({ data: req.body });
    return res.status(201).json(tag);
  }),
);

/**
 * PATCH /tags/:id — somente ADMIN.
 */
tagsRouter.patch(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateTagSchema),
  asyncHandler(async (req, res) => {
    const existing = await prisma.tag.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Etiqueta não encontrada' });
    }
    const tag = await prisma.tag.update({ where: { id: req.params.id }, data: req.body });
    return res.status(200).json(tag);
  }),
);

/**
 * DELETE /tags/:id — somente ADMIN.
 */
tagsRouter.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req, res) => {
    const existing = await prisma.tag.findUnique({ where: { id: req.params.id } });
    if (!existing) {
      return res.status(404).json({ error: 'Etiqueta não encontrada' });
    }
    await prisma.tag.delete({ where: { id: req.params.id } });
    return res.status(204).send();
  }),
);
