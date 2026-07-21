import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs/promises';
import { Express } from 'express';
import { IChatAttachmentUploaderRepository } from '../../domain/Repository/i-chat-attachment-upload-repository';

export class ChatAttachmentUploader implements IChatAttachmentUploaderRepository {
  private s3Client?: S3Client;
  private bucketName?: string;
  private region?: string;
  private hasS3Config: boolean;

  constructor() {
    this.bucketName = process.env.AWS_BUCKET_NAME;
    this.region = process.env.AWS_REGION;
    this.hasS3Config = Boolean(
      this.bucketName &&
      this.region &&
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY
    );

    if (this.hasS3Config) {
      this.s3Client = new S3Client({
        region: this.region,
        credentials: {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        },
      });
    }
  }

  async upload(file: Express.Multer.File): Promise<string> {
    if (!this.hasS3Config || !this.s3Client || !this.bucketName || !this.region) {
      return this.getLocalFileUrl(file);
    }

    const fileExtension = path.extname(file.originalname);
    const filename = `chat-attachments/${uuidv4()}${fileExtension}`;
    const fileBuffer = await fs.readFile(file.path);
    
    const uploadParams = {
      Bucket: this.bucketName,
      Key: filename,
      Body: fileBuffer,
      ContentType: file.mimetype,
    };

    const command = new PutObjectCommand(uploadParams);
    try {
      await this.s3Client.send(command);
    } catch (error) {
      console.error('S3 chat attachment upload failed, using local file:', error);
      return this.getLocalFileUrl(file);
    }

    const url = `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${filename}`;

    await fs.unlink(file.path).catch((err) =>
      console.error(`Failed to delete local file ${file.path}:`, err)
    );

    return url;
  }

  private getLocalFileUrl(file: Express.Multer.File): string {
    const publicBaseUrl = process.env.PUBLIC_API_URL || `http://localhost:${process.env.PORT || 5000}`;
    return `${publicBaseUrl}/uploads/chat-attachments/${path.basename(file.path)}`;
  }
}
