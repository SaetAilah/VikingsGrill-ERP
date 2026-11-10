import { promisify } from 'node:util';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';

const scrypt = promisify(scryptCallback);

export const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export const hashPassword = async (password, salt = randomBytes(16).toString('hex')) => {
  const derived = await scrypt(password, salt, 64);
  return { salt, digest: derived.toString('hex') };
};

export const verifyPassword = async (password, storedHash) => {
  const [salt, expectedDigest] = String(storedHash || '').split(':');
  if (!salt || !expectedDigest) return false;
  const derived = await scrypt(password, salt, 64);
  const derivedBuf = Buffer.from(derived.toString('hex'), 'utf8');
  const expectedBuf = Buffer.from(expectedDigest, 'utf8');
  return derivedBuf.length === expectedBuf.length && timingSafeEqual(derivedBuf, expectedBuf);
};

export const generateSessionToken = () => randomBytes(32).toString('base64url');

export const userView = (user) => ({
  id: user.id,
  name: user.full_name,
  email: user.email,
  role: user.role,
});

