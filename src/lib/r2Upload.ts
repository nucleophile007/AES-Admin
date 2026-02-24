import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Validate environment variables
const R2_ENDPOINT = process.env.R2_ENDPOINT;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

if (!R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
  console.error('Missing R2 configuration:', {
    hasEndpoint: !!R2_ENDPOINT,
    hasAccessKey: !!R2_ACCESS_KEY_ID,
    hasSecretKey: !!R2_SECRET_ACCESS_KEY,
    hasBucket: !!R2_BUCKET_NAME,
    hasPublicUrl: !!R2_PUBLIC_URL,
  });
}

// Configure S3 client for Cloudflare R2
const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
});

export interface UploadResult {
  fileUrl: string;
  fileName: string;
  fileSize: number;
}

/**
 * Upload a file to Cloudflare R2
 * @param file - File buffer to upload
 * @param fileName - File name (can include path like "event-images/file.jpg")
 * @param contentType - MIME type of the file
 * @returns Upload result with public URL, file name, and size
 */
export async function uploadToR2(
  file: Buffer,
  fileName: string,
  contentType: string
): Promise<UploadResult> {
  try {
    // Validate configuration
    if (!R2_BUCKET_NAME) {
      throw new Error('R2_BUCKET_NAME is not configured');
    }
    if (!R2_PUBLIC_URL) {
      throw new Error('R2_PUBLIC_URL is not configured');
    }

    console.log('Uploading to R2:', {
      bucket: R2_BUCKET_NAME,
      key: fileName,
      size: file.length,
      contentType,
    });

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: fileName,
      Body: file,
      ContentType: contentType,
    });

    await r2Client.send(command);

    // Construct public URL
    const fileUrl = `${R2_PUBLIC_URL}/${fileName}`;

    console.log('Upload successful:', fileUrl);

    return {
      fileUrl,
      fileName,
      fileSize: file.length,
    };
  } catch (error) {
    console.error('Error uploading to R2:', error);
    throw new Error(`Failed to upload file to R2: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
