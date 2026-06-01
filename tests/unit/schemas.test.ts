import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema } from '../../src/schemas/auth.schema';
import { createTaskSchema } from '../../src/schemas/task.schema';
import { createTagSchema } from '../../src/schemas/tag.schema';

describe('registerSchema', () => {
  it('aceita um cadastro válido', () => {
    const result = registerSchema.safeParse({
      name: 'Maria',
      email: 'maria@taskflow.dev',
      password: 'senha123',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita e-mail inválido', () => {
    const result = registerSchema.safeParse({
      name: 'Maria',
      email: 'nao-e-email',
      password: 'senha123',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita senha curta (menos de 6 caracteres)', () => {
    const result = registerSchema.safeParse({
      name: 'Maria',
      email: 'maria@taskflow.dev',
      password: '123',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita nome curto (menos de 2 caracteres)', () => {
    const result = registerSchema.safeParse({
      name: 'M',
      email: 'maria@taskflow.dev',
      password: 'senha123',
    });
    expect(result.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('aceita credenciais bem formadas', () => {
    const result = loginSchema.safeParse({
      email: 'maria@taskflow.dev',
      password: 'qualquer',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita quando falta a senha', () => {
    const result = loginSchema.safeParse({ email: 'maria@taskflow.dev', password: '' });
    expect(result.success).toBe(false);
  });
});

describe('createTaskSchema', () => {
  const projectId = '11111111-1111-1111-1111-111111111111';

  it('aceita uma tarefa válida', () => {
    const result = createTaskSchema.safeParse({
      title: 'Escrever testes',
      status: 'TODO',
      priority: 'HIGH',
      projectId,
    });
    expect(result.success).toBe(true);
  });

  it('rejeita status fora da lista permitida', () => {
    const result = createTaskSchema.safeParse({
      title: 'Tarefa',
      status: 'INVALIDO',
      projectId,
    });
    expect(result.success).toBe(false);
  });

  it('rejeita projectId que não é UUID', () => {
    const result = createTaskSchema.safeParse({ title: 'Tarefa', projectId: 'abc' });
    expect(result.success).toBe(false);
  });

  it('rejeita título vazio', () => {
    const result = createTaskSchema.safeParse({ title: '', projectId });
    expect(result.success).toBe(false);
  });
});

describe('createTagSchema', () => {
  it('aceita cor hexadecimal válida', () => {
    const result = createTagSchema.safeParse({ name: 'bug', color: '#00ff00' });
    expect(result.success).toBe(true);
  });

  it('rejeita cor em formato inválido', () => {
    const result = createTagSchema.safeParse({ name: 'bug', color: 'verde' });
    expect(result.success).toBe(false);
  });
});
