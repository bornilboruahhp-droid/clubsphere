import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const databaseUrl = process.env.DATABASE_URL || "";

let prisma: PrismaClient;

if (process.env.NODE_ENV === "production") {
  if (databaseUrl.startsWith("prisma+postgres://")) {
    prisma = new PrismaClient();
  } else {
    const pool = new Pool({ connectionString: databaseUrl });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({ adapter });
  }
} else {
  if (!globalThis.prismaGlobal) {
    if (databaseUrl.startsWith("prisma+postgres://")) {
      globalThis.prismaGlobal = new PrismaClient();
    } else {
      const pool = new Pool({ connectionString: databaseUrl });
      const adapter = new PrismaPg(pool);
      globalThis.prismaGlobal = new PrismaClient({ adapter });
    }
  }
  prisma = globalThis.prismaGlobal;
}

export { prisma };
