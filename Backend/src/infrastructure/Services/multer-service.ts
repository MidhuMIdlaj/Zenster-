// multerConfig.ts
import multer, { diskStorage, Multer } from 'multer';
import { Request } from 'express';
import path from 'path';
import fs from 'fs';

export class MulterConfig {
  private uploadDir: string;
  private storage: multer.StorageEngine;
  private upload: Multer;

  constructor() {
    this.uploadDir = path.join(__dirname, '../../uploads/completion-photos');
    this.ensureUploadDirExists();
    this.storage = this.configureStorage();
    this.upload = this.createMulterInstance();
  }

  private ensureUploadDirExists(): void {
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  private configureStorage(): multer.StorageEngine {
    return diskStorage({
      destination: (req, file, cb) => {
        cb(null, this.uploadDir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `completion-${uniqueSuffix}${path.extname(file.originalname)}`);
      }
    });
  }

  private createMulterInstance(): Multer {
    return multer({
      storage: this.storage,
      fileFilter: this.fileFilter,
      limits: {
        fileSize: 5 * 1024 * 1024, 
        files: 10
      }
    });
  }

  private fileFilter(req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback): void {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  }

  public getUpload(): Multer {
    return this.upload;
  }
}
