import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    // Banco de testes isolado (arquivo separado do dev.db).
    // O adapter better-sqlite3 resolve o caminho a partir da raiz do projeto,
    // por isso usamos "file:./prisma/test.db" aqui.
    env: {
      DATABASE_URL: 'file:./prisma/test.db',
      JWT_SECRET: 'segredo-de-testes',
      JWT_EXPIRES_IN: '1h',
      NODE_ENV: 'test',
    },
    // SQLite é um arquivo único: rodamos os arquivos de teste em série
    // para evitar conflitos de escrita concorrente.
    fileParallelism: false,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'text-summary', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/types/**', 'src/**/*.d.ts'],
      thresholds: {
        lines: 70,
        functions: 70,
      },
    },
  },
});
