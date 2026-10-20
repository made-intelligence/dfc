import { Prisma } from '@prisma/client';
import { getPrivateObjectUrl, SECOND_OPINION_BUCKET } from '@/lib/s3';

interface StoredDocument {
  key?: string;
  url?: string;
  name?: string;
  type?: string;
  size?: number;
  uploadedAt?: string;
}

// Case documents uploaded before the S3 migration only have a permanent
// `url` (Cloudinary). Newer uploads store an S3 `key` and need a fresh
// signed URL on every read since the bucket is private.
export async function signCaseDocuments(documents: Prisma.JsonValue | null): Promise<StoredDocument[]> {
  if (!Array.isArray(documents)) return [];

  return Promise.all(
    (documents as StoredDocument[]).map(async (doc) => {
      if (!doc.key) return doc;
      try {
        const url = await getPrivateObjectUrl(SECOND_OPINION_BUCKET, doc.key);
        return { ...doc, url };
      } catch {
        return { ...doc, url: undefined };
      }
    })
  );
}
