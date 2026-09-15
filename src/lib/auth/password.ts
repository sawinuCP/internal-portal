import { compare, hash } from "bcryptjs";

const BCRYPT_COST = 12;

/**
 * One-way hash for credential storage. Plaintext passwords are never
 * persisted or logged — only this hash ever reaches the database.
 */
export function hashPassword(plainPassword: string): Promise<string> {
  return hash(plainPassword, BCRYPT_COST);
}

/** Timing-safe credential check (bcrypt.compare). */
export function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  return compare(plainPassword, passwordHash);
}
