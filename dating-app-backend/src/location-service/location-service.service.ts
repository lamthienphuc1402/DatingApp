import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

@Injectable()
export class LocationService {
  private readonly apiKey = '699e1297fecc461e8556db64e6fa05e0'; // Thay thế bằng API key của bạn
  private readonly apiUrl = 'https://api.ipgeolocation.io/ipgeo'; // URL của dịch vụ lấy vị trí

  async getLocationByIP(ip: string): Promise<{ longitude: number; latitude: number }> {
    try {
      const response = await axios.get(`${this.apiUrl}?apiKey=${this.apiKey}&ip=${ip}`);
      const data = response.data;

      if (!data.longitude || !data.latitude) {
        throw new HttpException('Không tìm thấy thông tin vị trí', HttpStatus.NOT_FOUND);
      }

      return { longitude: data.longitude, latitude: data.latitude };
    } catch (error) {
      if (error instanceof AxiosError) {
        console.error('Lỗi Axios:', error.response?.data);
        throw new HttpException('Lỗi khi gọi API', error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR);
      } else {
        console.error('Lỗi không xác định:', error);
        throw new HttpException('Lỗi không xác định', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  }
}