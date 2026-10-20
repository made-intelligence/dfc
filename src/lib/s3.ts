import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// Neon-hosted, S3-compatible object storage. Credentials, region, and
// endpoint are read from AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY /
// AWS_REGION / AWS_ENDPOINT_URL_S3 by the SDK's default config provider.
const s3 = new S3Client({ forcePathStyle: true });

// Private bucket for sensitive uploads (e.g. second-opinion medical
// documents). General site imagery stays on Cloudinary for CDN delivery.
export const SECOND_OPINION_BUCKET = process.env.S3_SECOND_OPINION_BUCKET || "dfc-second-opinion";

export async function uploadPrivateObject(
  bucket: string,
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function getPrivateObjectUrl(
  bucket: string,
  key: string,
  expiresIn = 900
): Promise<string> {
  return getSignedUrl(s3, new GetObjectCommand({ Bucket: bucket, Key: key }), { expiresIn });
}
