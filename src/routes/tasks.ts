import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { asyncHandler, safeUserSelect } from '../lib/http';
import { authenticate } from '../middlewares/authenticate';
import { validate } from '../middlewares/validate';
import { getProjectAccess } from '../lib/access';
import { createTaskSchema, updateTaskSchema } from '../schemas/task.schema';

export const tasksRouter = Router();

tasksRouter.use(authenticate);

const taskInclude = {
  project: { select: { id: true, name: true } },
  assignee: { select: safeUserSelect },
  tags: { include: { tag: true } },
} as const;

/** Verifica se o usuário pode acessar o projeto da tarefa. */
async function canAccessProject(projectId: string, userId: string, role: string) {
  if (role === 'ADMIN') return true;
  const { role: access } = await getProjectAccess(projectId, userId);
  return access !== null;
}

/**
 * POST /tasks — cria uma tarefa em um projeto que o usuário possa acessar.
 */
tasksRouter.post(
  '/',
  validate(createTaskSchema),
  asyncHandler(async (req, res) => {
    const { projectId, assigneeId, tagIds, dueDate, ...rest } = req.body;

    const { project, role } = await getProjectAccess(projectId, req.user!.id);
    if (!project) {
      return res.status(404).json({ error: 'Projeto não encontrado' });
    }
    if (!role && req.user!.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Você não tem acesso a este projeto' });
    }

    const task = await prisma.task.create({
      data: {
        ...rest,
        dueDate: dueDate ?? null,
        projectId,
        assigneeId: assigneeId ?? null,
        ...(tagIds && tagIds.length
          ? { tags: { create: tagIds.map((tagId: string) => ({ tagId })) } }
          : {}),
      },
      include: taskInclude,
    });
    return res.status(201).json(task);
  }),
);

/**
 * GET /tasks — lista tarefas dos projetos acessíveis.
 * Filtros: ?projectId=...&status=...&page=1&limit=20  (pontos extras)
 */
tasksRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 20)));
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const projectId = typeof req.query.projectId === 'string' ? req.query.projectId : undefined;

    const isAdmin = req.user!.role === 'ADMIN';
    const accessibleProject = isAdmin
      ? {}
      : {
          project: {
            deletedAt: null,
            OR: [
              { ownerId: req.user!.id },
              { collaborators: { some: { userId: req.user!.id } } },
            ],
          },
        };

    const where = {
      ...accessibleProject,
      ...(status ? { status } : {}),
      ...(projectId ? { projectId } : {}),
    };

    const [total, tasks] = await Promise.all([
      prisma.task.count({ where }),
      prisma.task.findMany({
        where,
        include: taskInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return res.status(200).json({
      data: tasks,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  }),
);

/**
 * GET /tasks/:id — detalhe COM relacionamentos (projeto, responsável, tags).
 */
tasksRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const task = await prisma.task.findUnique({
      where: { id: req.params.id },
      include: taskInclude,
    });
    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    if (!(await canAccessProject(task.projectId, req.user!.id, req.user!.role))) {
      return res.status(403).json({ error: 'Você não tem acesso a esta tarefa' });
    }
    return res.status(200).json(task);
  }),
);

/**
 * PATCH /tasks/:id — atualiza (precisa ter acesso ao projeto da tarefa).
 */
tasksRouter.patch(
  '/:id',
  validate(updateTaskSchema),
  asyncHandler(async (req, res) => {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    if (!(await canAccessProject(task.projectId, req.user!.id, req.user!.role))) {
      return res.status(403).json({ error: 'Você não tem acesso a esta tarefa' });
    }

    const { tagIds, ...rest } = req.body;

    const updated = await prisma.task.update({
      where: { id: task.id },
      data: {
        ...rest,
        ...(tagIds
          ? {
              tags: {
                deleteMany: {},
                create: tagIds.map((tagId: string) => ({ tagId })),
              },
            }
          : {}),
      },
      include: taskInclude,
    });
    return res.status(200).json(updated);
  }),
);

/**
 * DELETE /tasks/:id — remove (precisa ter acesso ao projeto da tarefa).
 */
tasksRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const task = await prisma.task.findUnique({ where: { id: req.params.id } });
    if (!task) {
      return res.status(404).json({ error: 'Tarefa não encontrada' });
    }
    if (!(await canAccessProject(task.projectId, req.user!.id, req.user!.role))) {
      return res.status(403).json({ error: 'Você não tem acesso a esta tarefa' });
    }
    await prisma.task.delete({ where: { id: task.id } });
    return res.status(204).send();
  }),
);
