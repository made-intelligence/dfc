import { PrismaClient } from "@prisma/client";
import { encryptPiiFields, decryptDeep, PII_FIELDS } from "./pii-encryption";

function buildPiiQueries() {
  const queries: Record<string, Record<string, (args: { args: Record<string, unknown>; query: (args: Record<string, unknown>) => Promise<unknown> }) => Promise<unknown>>> = {};

  // Writes are per-model: only the model being written has a field list.
  for (const model of Object.keys(PII_FIELDS)) {
    const lcModel = model.charAt(0).toLowerCase() + model.slice(1);
    queries[lcModel] = {
      async create({ args, query }: { args: Record<string, unknown>; query: (a: Record<string, unknown>) => Promise<unknown> }) {
        if (args.data) args.data = encryptPiiFields(model, args.data as Record<string, unknown>);
        const result = await query(args);
        return decryptDeep(result);
      },
      async update({ args, query }: { args: Record<string, unknown>; query: (a: Record<string, unknown>) => Promise<unknown> }) {
        if (args.data) args.data = encryptPiiFields(model, args.data as Record<string, unknown>);
        const result = await query(args);
        return decryptDeep(result);
      },
      async upsert({ args, query }: { args: Record<string, unknown>; query: (a: Record<string, unknown>) => Promise<unknown> }) {
        if (args.create) args.create = encryptPiiFields(model, args.create as Record<string, unknown>);
        if (args.update) args.update = encryptPiiFields(model, args.update as Record<string, unknown>);
        const result = await query(args);
        return decryptDeep(result);
      },
    };
  }

  return queries;
}

/**
 * Reads decrypt on every model, not only the ones that own PII fields.
 *
 * A findFirst on DFCMember that includes the user's phone is a query on
 * DFCMember, so a per-model hook never fired and the admin saw ciphertext.
 * Doing it here means every route is covered, including the ones nobody has
 * written yet, instead of twenty call sites each remembering to decrypt.
 */
const READ_OPERATIONS = [
  "findUnique",
  "findUniqueOrThrow",
  "findFirst",
  "findFirstOrThrow",
  "findMany",
] as const;

function buildReadDecryption() {
  const ops: Record<string, (ctx: { args: Record<string, unknown>; query: (a: Record<string, unknown>) => Promise<unknown> }) => Promise<unknown>> = {};
  for (const op of READ_OPERATIONS) {
    ops[op] = async ({ args, query }) => decryptDeep(await query(args));
  }
  return { $allModels: ops };
}

function createPrismaClient() {
  const base = new PrismaClient();

  return base
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .$extends({ query: buildPiiQueries() as any })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .$extends({ query: buildReadDecryption() as any }) as unknown as PrismaClient;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
