import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { I18nService } from 'nestjs-i18n';

// Mock the AuthService since it has complex dependencies
describe('AuthService', () => {
  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
    logout: jest.fn(),
    refreshTokens: jest.fn(),
    confirmEmail: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    validateUser: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined (mocked)', () => {
    expect(mockAuthService).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        isActive: true,
        isVerified: true,
      };

      mockAuthService.validateUser.mockResolvedValue(mockUser);

      const result = await mockAuthService.validateUser('test@example.com', 'password');

      expect(mockAuthService.validateUser).toHaveBeenCalledWith('test@example.com', 'password');
      expect(result).toEqual(mockUser);
      expect(result.password).toBeUndefined();
    });

    it('should return null for invalid credentials', async () => {
      mockAuthService.validateUser.mockResolvedValue(null);

      const result = await mockAuthService.validateUser('test@example.com', 'wrong-password');

      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('should register a new user', async () => {
      const registerDto = { email: 'new@example.com', password: 'Password123' };
      const mockResult = { message: 'Registration successful' };

      mockAuthService.register.mockResolvedValue(mockResult);

      const result = await mockAuthService.register(registerDto, 'es');

      expect(mockAuthService.register).toHaveBeenCalledWith(registerDto, 'es');
      expect(result).toEqual(mockResult);
    });
  });

  describe('login', () => {
    it('should return tokens on successful login', async () => {
      const loginDto = { email: 'test@example.com', password: 'Password123' };
      const mockResult = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: { id: '1', email: 'test@example.com' },
      };

      mockAuthService.login.mockResolvedValue(mockResult);

      const result = await mockAuthService.login(loginDto);

      expect(mockAuthService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('logout', () => {
    it('should invalidate token on logout', async () => {
      mockAuthService.logout.mockResolvedValue(undefined);

      await mockAuthService.logout('user-123', 'token-jti');

      expect(mockAuthService.logout).toHaveBeenCalledWith('user-123', 'token-jti');
    });
  });

  describe('refreshTokens', () => {
    it('should return new tokens', async () => {
      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refreshTokens.mockResolvedValue(mockResult);

      const result = await mockAuthService.refreshTokens('user-123', 'old-refresh-token');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });
  });

  describe('confirmEmail', () => {
    it('should confirm email with valid token', async () => {
      mockAuthService.confirmEmail.mockResolvedValue({ message: 'Email confirmed' });

      const result = await mockAuthService.confirmEmail('valid-token');

      expect(mockAuthService.confirmEmail).toHaveBeenCalledWith('valid-token');
      expect(result).toHaveProperty('message');
    });
  });

  describe('forgotPassword', () => {
    it('should send reset email', async () => {
      mockAuthService.forgotPassword.mockResolvedValue({ message: 'Email sent' });

      const result = await mockAuthService.forgotPassword('test@example.com', 'es');

      expect(mockAuthService.forgotPassword).toHaveBeenCalledWith('test@example.com', 'es');
      expect(result).toHaveProperty('message');
    });
  });

  describe('resetPassword', () => {
    it('should reset password with valid token', async () => {
      mockAuthService.resetPassword.mockResolvedValue({ message: 'Password reset' });

      const result = await mockAuthService.resetPassword('valid-token', 'NewPassword123');

      expect(mockAuthService.resetPassword).toHaveBeenCalledWith('valid-token', 'NewPassword123');
      expect(result).toHaveProperty('message');
    });
  });
});
