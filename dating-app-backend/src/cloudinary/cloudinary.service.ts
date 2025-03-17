// cloudinary.service.ts

import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary-response';
const streamifier = require('streamifier');

@Injectable()
export class CloudinaryService {
  uploadFile(file: Express.Multer.File): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: 'profileImage',
          resource_type: 'auto',
          allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
          transformation: [
            { width: 800, height: 800, crop: 'limit' },
            { quality: 'auto:good' }
          ]
        },
        (error, result) => {
          if (error) {
            console.error('Lỗi khi upload ảnh lên Cloudinary:', error);
            return reject(error);
          }
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  deleteImage(publicId: string): Promise<CloudinaryResponse> {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(
        `profileImage/${publicId}`,
        {},
        (error, result) => {
          if (error) {
            console.error('Lỗi khi xóa ảnh từ Cloudinary:', error);
            return reject(error);
          }
          resolve(result);
        },
      );
    });
  }
}
