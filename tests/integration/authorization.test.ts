import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { createUser, createTag, bearer } from '../helpers';

const app = createApp();

describe('Leitura pública de /tags', () => {
  it('GET /tags funciona sem token (200)', async () => {
    await createTag('publica', '#123456');
    const res = await request(app).get('/tags');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
  });
});

describe('Autorização por papel (role) em /tags', () => {
  it('um USER NÃO pode criar etiqueta (403)', async () => {
    const { token } = await createUser({ role: 'USER' });
    const res = await request(app)
      .post('/tags')
      .set('Authorization', bearer(token))
      .send({ name: 'nova', color: '#abcdef' });

    expect(res.status).toBe(403);
  });

  it('um ADMIN PODE criar etiqueta (201)', async () => {
    const { token } = await createUser({ role: 'ADMIN' });
    const res = await request(app)
      .post('/tags')
      .set('Authorization', bearer(token))
      .send({ name: 'nova', color: '#abcdef' });

    expect(res.status).toBe(201);
    expect(res.body.name).toBe('nova');
  });

  it('exige autenticação para criar etiqueta (401)', async () => {
    const res = await request(app).post('/tags').send({ name: 'x' });
    expect(res.status).toBe(401);
  });
});

describe('Autorização por papel (role) em /users', () => {
  it('um USER NÃO pode listar usuários (403)', async () => {
    const { token } = await createUser({ role: 'USER' });
    const res = await request(app).get('/users').set('Authorization', bearer(token));
    expect(res.status).toBe(403);
  });

  it('um ADMIN PODE listar usuários (200) sem expor senhas', async () => {
    const { token } = await createUser({ role: 'ADMIN' });
    const res = await request(app).get('/users').set('Authorization', bearer(token));
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    for (const u of res.body) {
      expect(u.password).toBeUndefined();
    }
  });

  it('um USER NÃO pode apagar outro usuário (403)', async () => {
    const alvo = await createUser();
    const comum = await createUser({ role: 'USER' });
    const res = await request(app)
      .delete(`/users/${alvo.user.id}`)
      .set('Authorization', bearer(comum.token));
    expect(res.status).toBe(403);
  });

  it('um ADMIN PODE apagar um usuário (204)', async () => {
    const alvo = await createUser();
    const admin = await createUser({ role: 'ADMIN' });
    const res = await request(app)
      .delete(`/users/${alvo.user.id}`)
      .set('Authorization', bearer(admin.token));
    expect(res.status).toBe(204);
  });
});
