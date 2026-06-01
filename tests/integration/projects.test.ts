import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { createUser, bearer } from '../helpers';

const app = createApp();

describe('CRUD de /projects', () => {
  it('cria um projeto (201)', async () => {
    const { token } = await createUser();
    const res = await request(app)
      .post('/projects')
      .set('Authorization', bearer(token))
      .send({ name: 'Meu Projeto', description: 'Descrição' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('Meu Projeto');
  });

  it('lista projetos do usuário com paginação (200)', async () => {
    const { token } = await createUser();
    await request(app).post('/projects').set('Authorization', bearer(token)).send({ name: 'P1' });
    await request(app).post('/projects').set('Authorization', bearer(token)).send({ name: 'P2' });

    const res = await request(app).get('/projects').set('Authorization', bearer(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(2);
    expect(res.body.pagination.total).toBe(2);
  });

  it('busca um projeto por id COM relacionamentos (include) (200)', async () => {
    const { token } = await createUser();
    const created = await request(app)
      .post('/projects')
      .set('Authorization', bearer(token))
      .send({ name: 'Com include' });

    const res = await request(app)
      .get(`/projects/${created.body.id}`)
      .set('Authorization', bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.owner).toBeDefined();
    expect(Array.isArray(res.body.tasks)).toBe(true);
    expect(Array.isArray(res.body.collaborators)).toBe(true);
  });

  it('o dono atualiza o próprio projeto (200)', async () => {
    const { token } = await createUser();
    const created = await request(app)
      .post('/projects')
      .set('Authorization', bearer(token))
      .send({ name: 'Antigo' });

    const res = await request(app)
      .patch(`/projects/${created.body.id}`)
      .set('Authorization', bearer(token))
      .send({ name: 'Novo Nome' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Novo Nome');
  });

  it('soft delete: DELETE devolve 204 e depois o GET devolve 404', async () => {
    const { token } = await createUser();
    const created = await request(app)
      .post('/projects')
      .set('Authorization', bearer(token))
      .send({ name: 'Some' });

    const del = await request(app)
      .delete(`/projects/${created.body.id}`)
      .set('Authorization', bearer(token));
    expect(del.status).toBe(204);

    const get = await request(app)
      .get(`/projects/${created.body.id}`)
      .set('Authorization', bearer(token));
    expect(get.status).toBe(404);
  });
});

describe('Autorização por propriedade (ownership) em /projects', () => {
  it('um USER não consegue editar o projeto de outro USER (403)', async () => {
    const dono = await createUser();
    const intruso = await createUser();

    const created = await request(app)
      .post('/projects')
      .set('Authorization', bearer(dono.token))
      .send({ name: 'Do dono' });

    const res = await request(app)
      .patch(`/projects/${created.body.id}`)
      .set('Authorization', bearer(intruso.token))
      .send({ name: 'Invasão' });

    expect(res.status).toBe(403);
  });

  it('um USER não consegue apagar o projeto de outro USER (403)', async () => {
    const dono = await createUser();
    const intruso = await createUser();

    const created = await request(app)
      .post('/projects')
      .set('Authorization', bearer(dono.token))
      .send({ name: 'Do dono' });

    const res = await request(app)
      .delete(`/projects/${created.body.id}`)
      .set('Authorization', bearer(intruso.token));

    expect(res.status).toBe(403);
  });
});

describe('Acesso não autenticado a /projects', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/projects');
    expect(res.status).toBe(401);
  });
});
