import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { RegistrationsService } from '../registrations/registrations.service';
import { Response } from 'express';

jest.mock('uuid', () => ({
  v4: () => 'test-uuid',
}));

describe('WalletController', () => {
  let controller: WalletController;
  let walletService: WalletService;
  let registrationsService: RegistrationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        {
          provide: WalletService,
          useValue: {
            createWalletLink: jest.fn(),
          },
        },
        {
          provide: RegistrationsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<WalletController>(WalletController);
    walletService = module.get<WalletService>(WalletService);
    registrationsService = module.get<RegistrationsService>(RegistrationsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getGoogleWalletLink', () => {
    it('should redirect to the wallet link', async () => {
      const mockRegistration = { id: '123' } as any;
      const mockUrl = 'https://pay.google.com/gp/v/save/token';
      const res = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      jest.spyOn(registrationsService, 'findOne').mockResolvedValue(mockRegistration);
      jest.spyOn(walletService, 'createWalletLink').mockResolvedValue(mockUrl);

      await controller.getGoogleWalletLink('123', res);

      expect(registrationsService.findOne).toHaveBeenCalledWith('123');
      expect(walletService.createWalletLink).toHaveBeenCalledWith(mockRegistration);
      expect(res.redirect).toHaveBeenCalledWith(mockUrl);
    });

    it('should handle errors', async () => {
      const res = {
        redirect: jest.fn(),
        status: jest.fn().mockReturnThis(),
        json: jest.fn(),
      } as unknown as Response;

      jest.spyOn(registrationsService, 'findOne').mockRejectedValue(new Error('Not found'));

      await controller.getGoogleWalletLink('123', res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error generating wallet link' }));
    });
  });
});
