import { execSync } from 'node:child_process';
import { beforeAll, afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/lib/prisma';

/**
 * Antes de toda a suíte: recria o schema no banco de testes isolado.
 *
 * O cliente em runtime usa DATABASE_URL="file:./prisma/test.db" (definido no
 * vitest.config.ts). Já o Prisma CLI resolve o caminho a partir da pasta do
 * schema (prisma/), então passamos "file:./test.db" para o `db push`.
 * Ambos apontam para o mesmo arquivo: prisma/test.db.
 */
beforeAll(() => {
  execSync('npx prisma db push --force-reset --skip-generate', {
    stdio: 'ignore',
    env: { ...process.env, DATABASE_URL: 'file:./test.db' },
  });
});

/** Limpa todas as tabelas antes de cada teste para garantir isolamento. */
beforeEach(async () => {
  // Ordem importa por causa das chaves estrangeiras.
  await prisma.taskTag.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectCollaborator.deleteMany();
  await prisma.project.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.user.deleteMany();
});

afterAll(async () => {
  await prisma.$disconnect();
});
