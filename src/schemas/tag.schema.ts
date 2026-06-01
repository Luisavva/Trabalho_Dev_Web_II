import { z } from 'zod';

const hexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Cor deve estar no formato hexadecimal (#rrggbb)');

export const createTagSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  color: hexColor.optional(),
});

export const updateTagSchema = z
  .object({
    name: z.string().min(1, 'Nome não pode ser vazio').optional(),
    color: hexColor.optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Informe ao menos um campo para atualizar',
  });

export type CreateTagInput = z.infer<typeof createTagSchema>;
export type UpdateTagInput = z.infer<typeof updateTagSchema>;
