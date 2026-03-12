import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromCookies } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const token = getTokenFromCookies(request.headers.get('cookie'));
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const caseId = formData.get('caseId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Verify case ownership if caseId provided
    if (caseId) {
      const soCase = await prisma.secondOpinionCase.findUnique({
        where: { id: caseId },
        select: { userId: true },
      });

      if (!soCase) {
        return NextResponse.json({ error: 'Case not found' }, { status: 404 });
      }

      // Only the case owner or admins can upload documents
      const isAdmin = payload.role === 'SUPERADMIN' || payload.role === 'SECRETARIAT';
      if (!isAdmin && soCase.userId !== payload.userId) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/webp',
      'application/dicom',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.dcm')) {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, images, DICOM, or Word documents.' },
        { status: 400 }
      );
    }

    // Max 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum 20MB.' }, { status: 400 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;

    if (!cloudName || !uploadPreset) {
      return NextResponse.json({ error: 'File upload not configured' }, { status: 500 });
    }

    // Upload to Cloudinary
    const cloudinaryForm = new FormData();
    cloudinaryForm.append('file', file);
    cloudinaryForm.append('upload_preset', uploadPreset);
    cloudinaryForm.append('folder', `dfc/second-opinion/${caseId || 'unlinked'}`);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
      { method: 'POST', body: cloudinaryForm }
    );

    if (!res.ok) {
      const err = await res.text();
      logger.error('SecondOpinionUpload', err);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const data = await res.json();

    return NextResponse.json({
      success: true,
      document: {
        url: data.secure_url,
        name: file.name,
        type: file.type,
        size: file.size,
        cloudinaryId: data.public_id,
        uploadedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('SecondOpinionUpload', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
