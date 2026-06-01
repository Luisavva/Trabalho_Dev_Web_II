import express from 'express';
import cors from 'cors';

import { authRouter } from './routes/auth';
import { usersRouter } from './routes/users';
import { projectsRouter } from './routes/projects';
import { tasksRouter } from './routes/tasks';
import { tagsRouter } from './routes/tags';
import { notFound, errorHandler } from './middlewares/errorHandler';

/**
 * Cria e configura a aplicação Express.
 * Exportada como factory para que os testes criem instâncias isoladas.
 */
export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Healthcheck
  app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

  // Rotas
  app.use('/auth', authRouter);
  app.use('/users', usersRouter);
  app.use('/projects', projectsRouter);
  app.use('/tasks', tasksRouter);
  app.use('/tags', tagsRouter);

  // 404 + tratador de erros (sempre por último)
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
