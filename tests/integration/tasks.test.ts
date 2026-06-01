import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { createUser, createProject, createTag, bearer } from '../helpers';

const app = createApp();

describe('CRUD de /tasks', () => {
  it('cria uma tarefa em um projeto próprio, com etiqueta (201)', async () => {
    const { user, token } = await createUser();
    const project = await createProject(user.id);
    const tag = await createTag('feature', '#00ff00');

    const res = await request(app)
      .post('/tasks')
      .set('Authorization', bearer(token))
      .send({
        title: 'Implementar login',
        status: 'TODO',
        priority: 'HIGH',
        projectId: project.id,
        tagIds: [tag.id],
      });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Implementar login');
    expect(res.body.project.id).toBe(project.id);
    expect(res.body.tags.length).toBe(1);
    expect(res.body.tags[0].tag.name).toBe('feature');
  });

  it('busca a tarefa por id COM relacionamentos (200)', async () => {
    const { user, token } = await createUser();
    const project = await createProject(user.id);
    const created = await request(app)
      .post('/tasks')
      .set('Authorization', bearer(token))
      .send({ title: 'Tarefa X', projectId: project.id });

    const res = await request(app)
      .get(`/tasks/${created.body.id}`)
      .set('Authorization', bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.project).toBeDefined();
    expect(res.body).toHaveProperty('assignee');
    expect(Array.isArray(res.body.tags)).toBe(true);
  });

  it('atualiza uma tarefa (200)', async () => {
    const { user, token } = await createUser();
    const project = await createProject(user.id);
    const created = await request(app)
      .post('/tasks')
      .set('Authorization', bearer(token))
      .send({ title: 'Pendente', projectId: project.id });

    const res = await request(app)
      .patch(`/tasks/${created.body.id}`)
      .set('Authorization', bearer(token))
      .send({ status: 'DONE' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('DONE');
  });

  it('apaga uma tarefa (204)', async () => {
    const { user, token } = await createUser();
    const project = await createProject(user.id);
    const created = await request(app)
      .post('/tasks')
      .set('Authorization', bearer(token))
      .send({ title: 'Apagar', projectId: project.id });

    const res = await request(app)
      .delete(`/tasks/${created.body.id}`)
      .set('Authorization', bearer(token));

    expect(res.status).toBe(204);
  });

  it('rejeita criação de tarefa em projeto sem acesso (403)', async () => {
    const dono = await createUser();
    const intruso = await createUser();
    const project = await createProject(dono.user.id);

    const res = await request(app)
      .post('/tasks')
      .set('Authorization', bearer(intruso.token))
      .send({ title: 'Invasão', projectId: project.id });

    expect(res.status).toBe(403);
  });

  it('rejeita criação com dados inválidos (422)', async () => {
    const { user, token } = await createUser();
    const project = await createProject(user.id);

    const res = await request(app)
      .post('/tasks')
      .set('Authorization', bearer(token))
      .send({ title: '', projectId: project.id });

    expect(res.status).toBe(422);
  });
});
