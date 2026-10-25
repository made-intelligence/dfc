import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { audit } from '@/lib/audit';
import { uploadRateLimit } from '@/lib/rate-limit';
import { uploadPrivateObject, getPrivateObjectUrl, SECOND_OPINION_BUCKET } from '@/lib/s3';
import crypto from 'crypto';

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/dicom',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

// Magic bytes for content validation
const MAGIC_BYTES: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]],          // %PDF
  'image/jpeg': [[0xFF, 0xD8, 0xFF]],                       // JPEG SOI
  'image/png': [[0x89, 0x50, 0x4E, 0x47]],                  // .PNG
  'image/webp': [[0x52, 0x49, 0x46, 0x46]],                 // RIFF (WebP)
  'application/msword': [[0xD0, 0xCF, 0x11, 0xE0]],         // OLE2
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4B, 0x03, 0x04]], // ZIP/OOXML
};

function validateFileContent(buffer: ArrayBuffer, declaredType: string): boolean {
  const bytes = new Uint8Array(buffer).slice(0, 8);
  const signatures = MAGIC_BYTES[declaredType];
  if (!signatures) return true; // DICOM and others pass through
  return signatures.some(sig => sig.every((byte, i) => bytes[i] === byte));
}

function generateSafeFilename(originalName: string): string {
  const ext = originalName.split('.').pop()?.toLowerCase() || 'bin';
  const safeExt = ext.replace(/[^a-z0-9]/g, '');
  return `${crypto.randomUUID()}.${safeExt}`;
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await uploadRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    // Auth is optional for initial form uploads, required for case-linked uploads
    const token = getTokenFromCookies(request.headers.get('cookie'));
    const payload = token ? await verifyToken(token) : null;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const caseId = formData.get('caseId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Case-linked uploads require authentication + ownership check
    if (caseId) {
      if (!payload) {
        return NextResponse.json({ error: 'Authentication required for case-linked uploads' }, { status: 401 });
      }

      const soCase = await prisma.secondOpinionCase.findUnique({
        where: { id: caseId },
        select: { userId: true },
      });

      if (!soCase) {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 });
      }

      const isAdmin = payload.role === 'SUPERADMIN' || payload.role === 'SECRETARIAT';
      if (!isAdmin && soCase.userId !== payload.userId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Validate declared MIME type
    const isDicom = file.name.endsWith('.dcm');
    if (!ALLOWED_MIME_TYPES.has(file.type) && !isDicom) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, images, DICOM, or Word documents.' },
        { status: 400 }
      );
    }

    // Max 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 20MB.' }, { status: 400 });
    }

    // Validate file content matches declared type (magic bytes)
    const buffer = await file.arrayBuffer();
    if (!isDicom && !validateFileContent(buffer, file.type)) {
      return NextResponse.json(
        { error: 'File content does not match declared type.' },
        { status: 400 }
      );
    }

    // Generate safe filename to prevent path traversal
    const safeFilename = generateSafeFilename(file.name);
    const key = `second-opinion/${caseId || 'unlinked'}/${safeFilename}`;

    // Upload to Neon object storage (S3-compatible), kept private since
    // these are patient medical documents.
    try {
      await uploadPrivateObject(SECOND_OPINION_BUCKET, key, Buffer.from(buffer), file.type || 'application/octet-stream');
    } catch (err) {
      logger.error('SecondOpinionUpload', err);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Short-lived preview URL so the uploader can confirm the upload succeeded.
    // Documents are re-signed on every authorized read of the case afterwards.
    const previewUrl = await getPrivateObjectUrl(SECOND_OPINION_BUCKET, key);
    await audit({
      userId: payload?.userId ?? null,
      action: 'FILE_UPLOAD',
      resource: 'second_opinion_document',
      resourceId: caseId ?? undefined,
      details: { key, size: file.size, type: file.type },
    }, request);

    return NextResponse.json({
      success: true,
      document: {
        key,
        url: previewUrl,
        name: file.name,
        type: file.type,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('SecondOpinionUpload', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
