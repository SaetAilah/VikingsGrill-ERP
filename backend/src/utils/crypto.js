import { promisify } from 'node:util';
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import bcrypt from 'bcryptjs';

const scrypt = promisify(scryptCallback);

export const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export const hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};

export const verifyPassword = async (password, storedHash) => {
  if (!storedHash || !password) return false;
  // If bcrypt hash (starts with $2)
  if (storedHash.startsWith('$2')) {
    return bcrypt.compare(password, storedHash);
  }
  // Fallback to legacy scrypt (salt:digest)
  const [salt, expectedDigest] = String(storedHash).split(':');
  if (!salt || !expectedDigest) return false;
  try {
    const derived = await scrypt(password, salt, 64);
    const derivedBuf = Buffer.from(derived.toString('hex'), 'utf8');
    const expectedBuf = Buffer.from(expectedDigest, 'utf8');
    return derivedBuf.length === expectedBuf.length && timingSafeEqual(derivedBuf, expectedBuf);
  } catch {
    return false;
  }
};

export const generateSessionToken = () => randomBytes(32).toString('base64url');

export const userView = (user) => ({
  id: user.id,
  name: user.name || user.full_name,
  email: user.email,
  role: user.role,
  role_id: user.role_id,
});
