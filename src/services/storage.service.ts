import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export const StorageService = {
  uploadFile: async (file: Express.Multer.File, folder: string) => {
    const key = `${folder}/${Date.now()}-${file.originalname}`;
    
    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: file.buffer, 
      ContentType: file.mimetype,
    }));

    return `${process.env.R2_PUBLIC_CUSTOM_DOMAIN}/${key}`;
  }
};