import AWS from 'aws-sdk';
import fs from 'fs';
import path from 'path';

const storageProvider = process.env.STORAGE_PROVIDER || 'local';

// Initialize S3 only if needed
let s3: AWS.S3 | null = null;
const getS3 = (): AWS.S3 => {
  if (!s3) {
    s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }
  return s3;
};

/**
 * Upload a file to storage (S3 or local).
 * Returns the public URL of the uploaded file.
 */
export async function uploadFile(
  localPath: string,
  destKey: string,
  mimetype: string
): Promise<string> {
  if (storageProvider === 's3') {
    const fileContent = fs.readFileSync(localPath);
    const bucket = process.env.AWS_S3_BUCKET || 'ai-interview-coach-files';

    await getS3()
      .upload({
        Bucket: bucket,
        Key: destKey,
        Body: fileContent,
        ContentType: mimetype,
        ACL: 'public-read',
      })
      .promise();

    // Delete local temp file after S3 upload
    fs.unlinkSync(localPath);

    return `https://${bucket}.s3.amazonaws.com/${destKey}`;
  } else {
    // Local storage — just return the relative URL path
    return `/uploads/${path.basename(destKey)}`;
  }
}

/**
 * Delete a file from storage.
 */
export async function deleteFile(fileKey: string): Promise<void> {
  if (storageProvider === 's3') {
    const bucket = process.env.AWS_S3_BUCKET || 'ai-interview-coach-files';
    await getS3()
      .deleteObject({ Bucket: bucket, Key: fileKey })
      .promise();
  } else {
    // Delete from local filesystem
    const localPath = path.join('uploads', path.basename(fileKey));
    if (fs.existsSync(localPath)) {
      fs.unlinkSync(localPath);
    }
  }
}
