import { PrismaClient } from "@prisma/client";
import { encryptPiiFields, decryptPiiFields, PII_FIELDS } from "./pii-encryption";

function buildPiiQueries() {
  const queries: Record<string, Record<string, (args: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => Promise<unknown> }) => Promise<unknown>>> = {};

  for (const model of Object.keys(PII_FIELDS)) {
    const lcModel = model.charAt(0).toLowerCase() + model.slice(1);
    queries[lcModel] = {
      async create({ args, query }: { args: Record<string, unknown>; query: (a: Record<string, unknown>) => Promise<unknown> }) {
        if (args.data) args.data = encryptPiiFields(model, args.data as Record<string, unknown>);
        const result = await query(args);
        return decryptPiiFields(model, result as Record<string, unknown>);
      },
      async update({ args, query }: { args: Record<string, unknown>; query: (a: Record<string, unknown>) => Promise<unknown> }) {
        if (args.data) args.data = encryptPiiFields(model, args.data as Record<string, unknown>);
        const result = await query(args);
        return decryptPiiFields(model, result as Record<string, unknown>);
      },
      async upsert({ args, query }: { args: Record<string, unknown>; query: (a: Record<string, unknown>) => Promise<unknown> }) {
        if (args.create) args.create = encryptPiiFields(model, args.create as Record<string, unknown>);
        if (args.update) args.update = encryptPiiFields(model, args.update as Record<string, unknown>);
        const result = await query(args);
        return decryptPiiFields(model, result as Record<string, unknown>);
      },
      async findUnique({ args, query }: { args: Record<string, unknown>; query: (a: Record<string, unknown>) => Promise<unknown> }) {
        const result = await query(args);
        return decryptPiiFields(model, result as Record<string, unknown>);
      },
      async findFirst({ args, query }: { args: Record<string, unknown>; query: (a: Record<string, unknown>) => Promise<unknown> }) {
        const result = await query(args);
        return decryptPiiFields(model, result as Record<string, unknown>);
      },
      async findMany({ args, query }: { args: Record<string, unknown>; query: (a: Record<string, unknown>) => Promise<unknown> }) {
        const results = await query(args);
        if (Array.isArray(results)) {
          return results.map((item) => decryptPiiFields(model, item as Record<string, unknown>));
        }
        return results;
      },
    };
  }

  return queries;
}

function createPrismaClient() {
  const base = new PrismaClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return base.$extends({ query: buildPiiQueries() as any }) as unknown as PrismaClient;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
