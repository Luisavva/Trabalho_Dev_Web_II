import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
});

export const updateProjectSchema = z
  .object({
    name: z.string().min(1, 'Nome não pode ser vazio').optional(),
    description: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export const addCollaboratorSchema = z.object({
  userId: z.string().uuid('userId deve ser um UUID válido'),
  role: z.enum(['MEMBER', 'MANAGER']).optional(),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
