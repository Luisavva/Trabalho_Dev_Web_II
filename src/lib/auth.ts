import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * bcryptjs implementa o mesmo algoritmo bcrypt do pacote nativo "bcrypt",
 * porém em JavaScript puro (sem dependência de compilação nativa).
 */
const SALT_ROUNDS = 10;

/** Gera o hash de uma senha em texto puro. */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

/** Compara uma senha em texto puro com um hash bcrypt. */
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface TokenPayload {
  /** id do usuário (subject) */
  sub: string;
  /** papel do usuário: "USER" | "ADMIN" */
  role: string;
}

function getSecret(): string {
  return process.env.JWT_SECRET ?? 'segredo-de-desenvolvimento';
}

/** Assina um JWT com o payload informado. */
export function signToken(payload: TokenPayload): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN ?? '1d') as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload, getSecret(), { expiresIn });
}

/**
 * Verifica e decodifica um JWT.
 * Lança erro se o token for inválido, expirado ou tiver formato inesperado.
 */
export function verifyToken(token: string): TokenPayload {
  const decoded = jwt.verify(token, getSecret());
  if (typeof decoded === 'string' || !decoded.sub) {
    throw new Error('Token inválido');
  }
  const payload = decoded as jwt.JwtPayload;
  return {
    sub: String(payload.sub),
    role: String(payload.role ?? 'USER'),
  };
}
