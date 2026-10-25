import 'server-only';
import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Records that an AI safety check could not run, as a WARNING alert in the
 * CDSS panel, so the physician checks by hand instead of reading the missing
 * result as "nothing found". One active alert per check, encounter and drug or
 * diagnosis is enough: the panel re-runs checks as the note is edited.
 */
export async function recordUnavailableCheck(data: {
  patientId: string;
  encounterId?: string | null;
  generatedForId: string;
  category: 'DRUG_ALLERGY' | 'DRUG_INTERACTION' | 'GUIDELINE';
  title: string;
  body: string;
  sourceData?: Prisma.InputJsonValue;
}): Promise<void> {
  const existing = await prisma.cDSSAlert.findFirst({
    where: {
      patientId: data.patientId,
      encounterId: data.encounterId ?? null,
      generatedForId: data.generatedForId,
      category: data.category,
      title: data.title,
      status: 'ACTIVE',
    },
    select: { id: true },
  });
  if (existing) return;

  await prisma.cDSSAlert.create({
    data: {
      patientId: data.patientId,
      encounterId: data.encounterId ?? null,
      generatedForId: data.generatedForId,
      level: 'WARNING',
      category: data.category,
      title: data.title,
      body: data.body,
      sourceData: { ...((data.sourceData as object) ?? {}), unavailable: true },
    },
  });
}
