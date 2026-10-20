import crypto from "crypto";
import { logger } from "@/lib/logger";

// Server-side Cloudinary helpers. Uploads and deletes are both signed with the
// API key + secret, so they only ever run on the server.

const IMAGE_MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],
  "image/png": [0x89, 0x50, 0x4e, 0x47],
  "image/webp": [0x52, 0x49, 0x46, 0x46],
  "image/gif": [0x47, 0x49, 0x46],
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

export class ImageValidationError extends Error {}

function credentials() {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return null;
  return { cloud: CLOUDINARY_CLOUD_NAME, apiKey: CLOUDINARY_API_KEY, secret: CLOUDINARY_API_SECRET };
}

/** Cloudinary signature: params sorted by key, joined as k=v&..., secret appended, SHA-1. */
function sign(params: Record<string, string>, secret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return crypto.createHash("sha1").update(toSign + secret).digest("hex");
}

/** Validates size, declared type and magic bytes, then uploads. Returns the secure URL. */
export async function uploadImage(file: File, folder?: string): Promise<string> {
  if (file.size > MAX_IMAGE_BYTES) throw new ImageValidationError("Image must be less than 5MB");
  const expectedMagic = IMAGE_MAGIC_BYTES[file.type];
  if (!expectedMagic) throw new ImageValidationError("Only JPG, PNG, WebP or GIF images are allowed");

  const buffer = await file.arrayBuffer();
  const head = new Uint8Array(buffer).slice(0, 8);
  if (!expectedMagic.every((byte, i) => head[i] === byte)) {
    throw new ImageValidationError("File content does not match declared type");
  }

  const creds = credentials();
  if (!creds) {
    logger.error("CloudinaryUpload", "Cloudinary credentials are not configured");
    throw new Error("Failed to upload image");
  }

  const ext = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const fd = new FormData();
  fd.append("file", new File([buffer], `${crypto.randomUUID()}.${ext}`, { type: file.type }));
  const params: Record<string, string> = { timestamp: Math.floor(Date.now() / 1000).toString() };
  if (folder) params.folder = folder;
  for (const [k, v] of Object.entries(params)) fd.append(k, v);
  fd.append("api_key", creds.apiKey);
  fd.append("signature", sign(params, creds.secret));

  const res = await fetch(`https://api.cloudinary.com/v1_1/${creds.cloud}/image/upload`, {
    method: "POST",
    body: fd,
  });
  const result = await res.json();
  if (!res.ok || !result.secure_url) {
    logger.error("CloudinaryUpload", result?.error ?? result);
    throw new Error("Failed to upload image");
  }
  return result.secure_url as string;
}

/**
 * Extracts the public_id from one of *our* Cloudinary delivery URLs, e.g.
 * https://res.cloudinary.com/<cloud>/image/upload/v123/folder/abc.jpg -> folder/abc.
 * Returns null for anything else (external URLs, local /public paths).
 */
export function publicIdFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  const prefix = `https://res.cloudinary.com/${cloud}/image/upload/`;
  if (!cloud || !url.startsWith(prefix)) return null;
  const rest = url.slice(prefix.length).split("?")[0];
  // Drop any transformation segments and the version, keep the path after them.
  const parts = rest.split("/");
  const vIdx = parts.findIndex((p) => /^v\d+$/.test(p));
  const path = (vIdx >= 0 ? parts.slice(vIdx + 1) : parts).join("/");
  return path.replace(/\.[a-z0-9]+$/i, "") || null;
}

/** Best-effort delete; never throws, so a cleanup failure can't break the request. */
export async function deleteImageByUrl(url: string | null | undefined): Promise<void> {
  const publicId = publicIdFromUrl(url);
  const creds = credentials();
  if (!publicId || !creds) return;

  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const signature = sign({ public_id: publicId, timestamp }, creds.secret);
    const body = new URLSearchParams({ public_id: publicId, timestamp, api_key: creds.apiKey, signature });
    const res = await fetch(`https://api.cloudinary.com/v1_1/${creds.cloud}/image/destroy`, {
      method: "POST",
      body,
    });
    if (!res.ok) logger.error("CloudinaryDelete", await res.text());
  } catch (error) {
    logger.error("CloudinaryDelete", error);
  }
}
