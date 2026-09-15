import { PrismaClient } from "@prisma/client";

// PrismaClient is attached to `globalThis` in development so Next.js hot
// reloads reuse one instance instead of exhausting the database connections.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
