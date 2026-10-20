import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/event-url";

/** A slug for a new event that no other event uses: base, base-2, base-3 ... */
export async function uniqueEventSlug(title: string): Promise<string> {
  const base = slugify(title);
  const taken = new Set(
    (
      await prisma.dFCEvent.findMany({
        where: { slug: { startsWith: base } },
        select: { slug: true },
      })
    ).map((e) => e.slug),
  );
  if (!taken.has(base)) return base;
  for (let n = 2; ; n++) {
    const candidate = `${base}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}
