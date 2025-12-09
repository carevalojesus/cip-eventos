import { Test, TestingModule } from '@nestjs/testing';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';
import { RegistrationsService } from '../registrations/registrations.service';
import { Response } from 'express';
import { NotFoundException, BadRequestException } from '@nestjs/common';

// Mock uuid module properly
jest.mock('uuid', () => ({
  v4: () => 'test-uuid',
  validate: (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
}));

describe('WalletController', () => {
  let controller: WalletController;
  let walletService: jest.Mocked<Partial<WalletService>>;
  let registrationsService: jest.Mocked<Partial<RegistrationsService>>;

  const createMockResponse = () => ({
    redirect: jest.fn(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  } as unknown as Response);

  beforeEach(async () => {
    walletService = {
      createWalletLink: jest.fn(),
      verifySignedToken: jest.fn(),
    };

    registrationsService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WalletController],
      providers: [
        { provide: WalletService, useValue: walletService },
        { provide: RegistrationsService, useValue: registrationsService },
      ],
    }).compile();

    controller = module.get<WalletController>(WalletController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getGoogleWalletLink', () => {
    const validUUID = '123e4567-e89b-12d3-a456-426614174000';
    const validToken = 'valid-token';

    it('should redirect to the wallet link', async () => {
      const mockRegistration = { id: validUUID } as any;
      const mockUrl = 'https://pay.google.com/gp/v/save/token';
      const res = createMockResponse();

      walletService.verifySignedToken!.mockReturnValue(undefined);
      registrationsService.findOne!.mockResolvedValue(mockRegistration);
      walletService.createWalletLink!.mockResolvedValue(mockUrl);

      await controller.getGoogleWalletLink(validUUID, validToken, res);

      expect(walletService.verifySignedToken).toHaveBeenCalledWith(validToken, validUUID);
      expect(registrationsService.findOne).toHaveBeenCalledWith(validUUID);
      expect(walletService.createWalletLink).toHaveBeenCalledWith(mockRegistration);
      expect(res.redirect).toHaveBeenCalledWith(mockUrl);
    });

    it('should return 400 for invalid UUID format', async () => {
      const res = createMockResponse();

      await controller.getGoogleWalletLink('invalid-uuid', validToken, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Invalid registration ID format' }),
      );
    });

    it('should return 400 when token is missing', async () => {
      const res = createMockResponse();

      await controller.getGoogleWalletLink(validUUID, undefined as any, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Missing security token' }),
      );
    });

    it('should return 404 when registration not found', async () => {
      const res = createMockResponse();

      walletService.verifySignedToken!.mockReturnValue(undefined);
      registrationsService.findOne!.mockResolvedValue(null);

      await controller.getGoogleWalletLink(validUUID, validToken, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Registration not found' }),
      );
    });

    it('should return 500 when wallet service throws error', async () => {
      const res = createMockResponse();
      const mockRegistration = { id: validUUID } as any;

      walletService.verifySignedToken!.mockReturnValue(undefined);
      registrationsService.findOne!.mockResolvedValue(mockRegistration);
      walletService.createWalletLink!.mockRejectedValue(new Error('Service error'));

      await controller.getGoogleWalletLink(validUUID, validToken, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: 'Failed to generate Google Wallet link' }),
      );
    });
  });
});
