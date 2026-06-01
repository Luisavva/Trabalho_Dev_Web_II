import { z } from 'zod';

export const TASK_STATUS = ['TODO', 'IN_PROGRESS', 'DONE'] as const;
export const TASK_PRIORITY = ['LOW', 'MEDIUM', 'HIGH'] as const;

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  status: z.enum(TASK_STATUS).optional(),
  priority: z.enum(TASK_PRIORITY).optional(),
  dueDate: z.coerce.date().optional(),
  projectId: z.string().uuid('projectId deve ser um UUID válido'),
  assigneeId: z.string().uuid('assigneeId deve ser um UUID válido').optional(),
  tagIds: z.array(z.string().uuid()).optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().min(1, 'Título não pode ser vazio').optional(),
    description: z.string().nullable().optional(),
    status: z.enum(TASK_STATUS).optional(),
    priority: z.enum(TASK_PRIORITY).optional(),
    dueDate: z.coerce.date().nullable().optional(),
    assigneeId: z.string().uuid().nullable().optional(),
    tagIds: z.array(z.string().uuid()).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
