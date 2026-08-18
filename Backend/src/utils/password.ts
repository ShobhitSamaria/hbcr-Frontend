/**
 * Password hashing built on bcryptjs (pure-JS bcrypt, no native build step).
 * Cost 10 keeps logins fast while still resisting offline brute force for
 * demo credentials; bump it via BCRYPT_ROUNDS for production.
 */
import { hash, compare } from "bcryptjs";

const ROUNDS = Number(process.env.BCRYPT_ROUNDS) || 10;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, ROUNDS);
}

export function verifyPassword(plain: string, hashed: string): Promise<boolean> {
  return compare(plain, hashed);
}
