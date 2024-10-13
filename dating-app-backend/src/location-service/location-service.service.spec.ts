import { Test, TestingModule } from '@nestjs/testing';
import { LocationServiceService } from './location-service.service';

describe('LocationServiceService', () => {
  let service: LocationServiceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LocationServiceService],
    }).compile();

    service = module.get<LocationServiceService>(LocationServiceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
