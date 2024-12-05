import { Test, TestingModule } from '@nestjs/testing';
import { TwofactorAuthController } from './twofactor-auth.controller';

describe('TwofactorAuthController', () => {
  let controller: TwofactorAuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TwofactorAuthController],
    }).compile();

    controller = module.get<TwofactorAuthController>(TwofactorAuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
