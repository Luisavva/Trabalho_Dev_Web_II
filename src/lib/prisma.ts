import { PrismaClient } from '@prisma/client';
import { PrismaBetterSQLite3 } from '@prisma/adapter-better-sqlite3';

/**
 * Cliente Prisma usando o adapter better-sqlite3 (requisito da atividade).
 *
 * O adapter resolve o caminho do arquivo a partir da RAIZ do projeto
 * (process.cwd()). Por isso a DATABASE_URL inclui "prisma/":
 *   DATABASE_URL="file:./prisma/dev.db"
 *
 * Já os comandos do Prisma CLI (migrate/studio) resolvem o caminho a
 * partir da pasta do schema (prisma/). Por isso os scripts npm passam
 * DATABASE_URL="file:./dev.db" para o CLI. Ambos apontam para o MESMO
 * arquivo físico: prisma/dev.db.
 */
const databaseUrl = process.env.DATABASE_URL ?? 'file:./prisma/dev.db';

const adapter = new PrismaBetterSQLite3({ url: databaseUrl });

export const prisma = new PrismaClient({ adapter });
