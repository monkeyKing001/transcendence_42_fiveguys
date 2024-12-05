import { Test, TestingModule } from '@nestjs/testing';
import { TwofactorAuthService } from './twofactor-auth.service';

describe('TwofactorAuthService', () => {
  let service: TwofactorAuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TwofactorAuthService],
    }).compile();

    service = module.get<TwofactorAuthService>(TwofactorAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
