import { prisma } from '../src/lib/prisma';
import { hashPassword, signToken } from '../src/lib/auth';

let counter = 0;

/**
 * Cria um usuário diretamente no banco (via Prisma) e devolve o usuário,
 * a senha em texto puro e um token JWT já assinado.
 *
 * Usamos esta helper (em vez de POST /auth/register) porque o register só
 * cria contas com papel USER — para testar regras de ADMIN precisamos criar
 * um ADMIN diretamente.
 */
export async function createUser(
  overrides: Partial<{ name: string; email: string; password: string; role: string }> = {},
) {
  counter += 1;
  const password = overrides.password ?? 'senha123';
  const user = await prisma.user.create({
    data: {
      name: overrides.name ?? `Usuário ${counter}`,
      email: overrides.email ?? `user${counter}.${Date.now()}@taskflow.dev`,
      password: await hashPassword(password),
      role: overrides.role ?? 'USER',
    },
  });

  const token = signToken({ sub: user.id, role: user.role });
  return { user, token, password };
}

/** Cabeçalho Authorization pronto para usar no Supertest. */
export function bearer(token: string) {
  return `Bearer ${token}`;
}

/** Cria um projeto pertencente a um usuário. */
export function createProject(ownerId: string, name = 'Projeto de Teste') {
  return prisma.project.create({ data: { name, ownerId } });
}

/** Cria uma etiqueta. */
export function createTag(name = 'urgente', color = '#ff0000') {
  return prisma.tag.create({ data: { name, color } });
}
