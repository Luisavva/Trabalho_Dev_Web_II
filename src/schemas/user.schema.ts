import { z } from 'zod';

export const updateUserSchema = z
  .object({
    name: z.string().min(2, 'Nome deve ter ao menos 2 caracteres').optional(),
    email: z.string().email('E-mail inválido').optional(),
    password: z.string().min(6, 'Senha deve ter ao menos 6 caracteres').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export const updateRoleSchema = z.object({
  role: z.enum(['USER', 'ADMIN'], { message: 'Papel deve ser USER ou ADMIN' }),
});

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
