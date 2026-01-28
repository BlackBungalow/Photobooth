import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';

export const s3 = new S3Client({
  region: env.S3_REGION,
  endpoint: env.S3_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY
  },
  forcePathStyle: true
});

export async function createUploadUrl(key: string, contentType: string) {
  const command = new PutObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key,
    ContentType: contentType
  });

  return getSignedUrl(s3, command, { expiresIn: 300 });
}

export async function createReadUrl(key: string) {
  const command = new GetObjectCommand({
    Bucket: env.S3_BUCKET,
    Key: key
  });

  return getSignedUrl(s3, command, { expiresIn: 300 });
}

export function resolvePublicUrl(key: string) {
  if (env.S3_PUBLIC_BASE_URL) {
    return `${env.S3_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
  }
  return null;
}
