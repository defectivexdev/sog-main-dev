import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const prismaClientSingleton = () => {
  const connectionString = process.env.DATABASE_URL!;
  const pool = new Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
};

declare global {
  // eslint-disable-next-line no-var
  var prismaGlobalV4: undefined | ReturnType<typeof prismaClientSingleton>;
}

const db = globalThis.prismaGlobalV4 ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalThis.prismaGlobalV4 = db;

export default db;
