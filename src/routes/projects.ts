import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, safeUserSelect } from '../lib/http';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { getProjectAccess } from '../lib/access';
import {
  createProjectSchema,
  updateProjectSchema,
  addCollaboratorSchema,
} from '../schemas/project.schema';

export const projectsRouter = Router();

// Todas as rotas de projeto exigem autenticação.
projectsRouter.use(authenticate);

/**
 * POST /projects — cria um projeto (o autor vira o dono).
 */
projectsRouter.post(
  '/',
  validate(createProjectSchema),
  asyncHandler(async (req, res) => {
    const project = await prisma.project.create({
      data: {
        name: req.body.name,
        description: req.body.description,
        ownerId: req.user!.id,
      },
    });
    return res.status(201).json(project);
  }),
);

/**
 * GET /projects — lista projetos onde o usuário é dono ou colaborador.
 * Suporta paginação e busca: ?page=1&limit=20&search=texto  (pontos extras)
 * ADMIN enxerga todos os projetos não deletados.
 */
projectsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;

    const isAdmin = req.user!.role === 'ADMIN';
    const where = {
      deletedAt: null,
      ...(search ? { name: { contains: search } } : {}),
      ...(isAdmin
        ? {}
        : {
            OR: [
              { ownerId: req.user!.id },
              { collaborators: { some: { userId: req.user!.id } } },
            ],
          }),
    };

    const [total, projects] = await Promise.all([
      prisma.project.count({ where }),
      prisma.project.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return res.status(200).json({
      data: projects,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }),
);

/**
 * GET /projects/:id — detalhe COM relacionamentos (include de tasks e
 * colaboradores). Exige acesso (dono, colaborador ou ADMIN).
 */
projectsRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { project, role } = await getProjectAccess(req.params.id, req.user!.id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    if (!role && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Você não tem acesso a este projeto' });
    }

    const full = await prisma.project.findUnique({
      where: { id: project.id },
      include: {
        owner: { select: safeUserSelect },
        tasks: {
          include: { tags: { include: { tag: true } } },
          orderBy: { createdAt: 'desc' },
        },
        collaborators: { include: { user: { select: safeUserSelect } } },
      },
    });
    return res.status(200).json(full);
  }),
);

/**
 * PATCH /projects/:id — controle de propriedade (dono ou ADMIN).
 */
projectsRouter.patch(
  '/:id',
  validate(updateProjectSchema),
  asyncHandler(async (req, res) => {
    const { project, role } = await getProjectAccess(req.params.id, req.user!.id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    if (role !== 'OWNER' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas o dono pode editar o projeto' });
    }

    const updated = await prisma.project.update({
      where: { id: project.id },
      data: req.body,
    });
    return res.status(200).json(updated);
  }),
);

/**
 * DELETE /projects/:id — controle de propriedade (dono ou ADMIN).
 * Faz SOFT DELETE (preenche deletedAt) — pontos extras.
 */
projectsRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const { project, role } = await getProjectAccess(req.params.id, req.user!.id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    if (role !== 'OWNER' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas o dono pode apagar o projeto' });
    }

    await prisma.project.update({
      where: { id: project.id },
      data: { deletedAt: new Date() },
    });
    return res.status(204).send();
  }),
);

/**
 * POST /projects/:id/collaborators — adiciona colaborador (dono ou ADMIN).
 */
projectsRouter.post(
  '/:id/collaborators',
  validate(addCollaboratorSchema),
  asyncHandler(async (req, res) => {
    const { project, role } = await getProjectAccess(req.params.id, req.user!.id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    if (role !== 'OWNER' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas o dono pode gerenciar colaboradores' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.body.userId } });
    if (!user) {
      return res.status(404).json({ error: 'Usuário a adicionar não encontrado' });
    }

    const existing = await prisma.projectCollaborator.findUnique({
      where: { projectId_userId: { projectId: project.id, userId: req.body.userId } },
    });
    if (existing) {
      return res.status(409).json({ error: 'Usuário já é colaborador' });
    }

    const collaborator = await prisma.projectCollaborator.create({
      data: {
        projectId: project.id,
        userId: req.body.userId,
        role: req.body.role ?? 'MEMBER',
      },
      include: { user: { select: safeUserSelect } },
    });
    return res.status(201).json(collaborator);
  }),
);

/**
 * DELETE /projects/:id/collaborators/:userId — remove colaborador.
 */
projectsRouter.delete(
  '/:id/collaborators/:userId',
  asyncHandler(async (req, res) => {
    const { project, role } = await getProjectAccess(req.params.id, req.user!.id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    if (role !== 'OWNER' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Apenas o dono pode gerenciar colaboradores' });
    }

    const existing = await prisma.projectCollaborator.findUnique({
      where: {
        projectId_userId: { projectId: project.id, userId: req.params.userId },
      },
    });
    if (!existing) {
      return res.status(404).json({ error: 'Colaborador não encontrado' });
    }

    await prisma.projectCollaborator.delete({
      where: { projectId_userId: { projectId: project.id, userId: req.params.userId } },
    });
    return res.status(204).send();
  }),
);
