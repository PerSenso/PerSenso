import { Injectable } from '@nestjs/common';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';

@Injectable()
export class StorageService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  async upload(buffer: Buffer, folder: string): Promise<string> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(
          { folder, resource_type: 'image' },
          (error, result: UploadApiResponse) => {
            if (error) return reject(error);
            resolve(result.secure_url);
          },
        )
        .end(buffer);
    });
  }

  async delete(url: string): Promise<void> {
    try {
      // URL format: https://res.cloudinary.com/{cloud}/image/upload/[v{n}/]{public_id}.{ext}
      const uploadIdx = url.indexOf('/upload/');
      if (uploadIdx === -1) return;

      let segment = url.slice(uploadIdx + '/upload/'.length);
      segment = segment.replace(/^v\d+\//, ''); // strip optional version prefix
      const publicId = segment.replace(/\.[^./]+$/, ''); // strip file extension

      await cloudinary.uploader.destroy(publicId);
    } catch {
      // silent — imagen puede ya no existir
    }
  }
}
