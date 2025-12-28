import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  region: process.env.BUCKET_REGION!,
  credentials: {
    accessKeyId: process.env.BUCKET_ACCESS_KEY_ID!,
    secretAccessKey: process.env.BUCKET_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToS3({
  buffer,
  key,
  mimeType,
}: {
  buffer: Buffer;
  key: string;
  mimeType: string;
}) {
  const uploadCommand = new PutObjectCommand({
    Bucket: process.env.BUCKET_S3_NAME!,
    Key: key,
    Body: buffer,
    ContentType: mimeType,
    ACL: "private" // bucket stays private
  });

  await s3.send(uploadCommand);

  return `https://${process.env.BUCKET_S3_NAME}.s3.${process.env.BUCKET_REGION}.amazonaws.com/${key}`;
}
