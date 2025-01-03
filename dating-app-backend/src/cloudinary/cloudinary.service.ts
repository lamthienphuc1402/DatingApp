// cloudinary.service.ts

import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryResponse } from './cloudinary-response';
const streamifier = require('streamifier');

@Injectable()
export class CloudinaryService {
  uploadFile(file: any): Promise<CloudinaryResponse> {
    return new Promise<CloudinaryResponse>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'profileImage' },
        (error, result) => {
          console.log(result);
          if (error) return reject(error);
          resolve(result);
        },
      );

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }
  deleteImage(publicId: string) {
    console.log(publicId);
    cloudinary.uploader.destroy(
      `profileImage/${publicId}`,
      {},
      (error, result) => {
        if (error) {
          console.log(error);
        }
        console.log(result);
        return result;
      },
    );
  }
}
