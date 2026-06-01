import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { createUser, bearer } from '../helpers';

const app = createApp();

describe('POST /auth/register', () => {
  it('registra um usuário com sucesso (201) e NÃO expõe a senha', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'João Silva',
      email: 'joao@taskflow.dev',
      password: 'senha123',
    });

    expect(res.status).toBe(201);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('joao@taskflow.dev');
    expect(res.body.user.password).toBeUndefined();
    expect(res.body.token).toBeTypeOf('string');
  });

  it('rejeita e-mail duplicado (409)', async () => {
    const payload = { name: 'Ana', email: 'ana@taskflow.dev', password: 'senha123' };
    await request(app).post('/auth/register').send(payload);
    const res = await request(app).post('/auth/register').send(payload);
    expect(res.status).toBe(409);
  });

  it('rejeita senha curta com erro de validação (422)', async () => {
    const res = await request(app).post('/auth/register').send({
      name: 'Curta',
      email: 'curta@taskflow.dev',
      password: '123',
    });
    expect(res.status).toBe(422);
    expect(res.body.error).toBeDefined();
  });
});

describe('POST /auth/login', () => {
  it('faz login com sucesso (200) e devolve token', async () => {
    const { user, password } = await createUser({ password: 'segredo123' });
    const res = await request(app)
      .post('/auth/login')
      .send({ email: user.email, password });

    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf('string');
    expect(res.body.user.password).toBeUndefined();
  });

  it('rejeita senha incorreta (401)', async () => {
    const { user } = await createUser({ password: 'segredo123' });
    const res = await request(app)
      .post('/auth/login')
      .send({ email: user.email, password: 'errada' });
    expect(res.status).toBe(401);
  });

  it('rejeita e-mail inexistente (401)', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: 'ninguem@taskflow.dev', password: 'qualquer' });
    expect(res.status).toBe(401);
  });
});

describe('GET /auth/me', () => {
  it('retorna 401 sem token', async () => {
    const res = await request(app).get('/auth/me');
    expect(res.status).toBe(401);
  });

  it('retorna 401 com token inválido', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Authorization', bearer('token.invalido'));
    expect(res.status).toBe(401);
  });

  it('retorna os dados do usuário autenticado (200) sem a senha', async () => {
    const { user, token } = await createUser();
    const res = await request(app).get('/auth/me').set('Authorization', bearer(token));

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(user.id);
    expect(res.body.password).toBeUndefined();
  });
});
