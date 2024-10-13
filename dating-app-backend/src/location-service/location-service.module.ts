import { Module } from '@nestjs/common';
import { LocationService } from './location-service.service';

@Module({
    providers: [LocationService],
    exports: [LocationService], // Export để sử dụng ở module khác
})
export class LocationServiceModule {}