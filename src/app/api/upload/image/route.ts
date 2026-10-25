import { NextRequest, NextResponse } from "next/server";
import { verifyToken, getTokenFromCookies } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { audit } from "@/lib/audit";
import { uploadRateLimit } from "@/lib/rate-limit";
import { uploadImage, ImageValidationError } from "@/lib/cloudinary";

export async function POST(request: NextRequest) {
  try {
    const rateLimitResponse = await uploadRateLimit(request);
    if (rateLimitResponse) return rateLimitResponse;

    // Require authentication
    const token = getTokenFromCookies(request.headers.get("cookie"));
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const url = await uploadImage(file);
    await audit({
      userId: payload.userId,
      action: "FILE_UPLOAD",
      resource: "image",
      details: { url, name: file.name, size: file.size, type: file.type },
    }, request);
    return NextResponse.json({ url });
  } catch (error) {
    if (error instanceof ImageValidationError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    logger.error('UploadImage', error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}
