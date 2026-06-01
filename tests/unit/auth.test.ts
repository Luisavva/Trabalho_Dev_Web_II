import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  signToken,
  verifyToken,
} from '../../src/lib/auth';

describe('Helpers de senha (bcrypt)', () => {
  it('o hash gerado é diferente da senha em texto puro', async () => {
    const plain = 'minhaSenha123';
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifyPassword retorna true para a senha correta', async () => {
    const plain = 'minhaSenha123';
    const hash = await hashPassword(plain);
    await expect(verifyPassword(plain, hash)).resolves.toBe(true);
  });

  it('verifyPassword retorna false para senha incorreta', async () => {
    const hash = await hashPassword('minhaSenha123');
    await expect(verifyPassword('senhaErrada', hash)).resolves.toBe(false);
  });
});

describe('Helpers de token (JWT)', () => {
  it('assina e decodifica o payload (roundtrip)', () => {
    const token = signToken({ sub: 'user-123', role: 'ADMIN' });
    expect(typeof token).toBe('string');

    const payload = verifyToken(token);
    expect(payload.sub).toBe('user-123');
    expect(payload.role).toBe('ADMIN');
  });

  it('verifyToken lança erro para um token inválido', () => {
    expect(() => verifyToken('token.invalido.aqui')).toThrow();
  });
});
