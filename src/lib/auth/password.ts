import { compare, hash } from "bcrypt";

const BCRYPT_COST = 12;

export function hashPassword(plainPassword: string): Promise<string> {
  return hash(plainPassword, BCRYPT_COST);
}

export function verifyPassword(plainPassword: string, passwordHash: string): Promise<boolean> {
  return compare(plainPassword, passwordHash);
}
