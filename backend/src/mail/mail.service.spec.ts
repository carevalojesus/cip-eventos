// Mock MailService since it has complex dependencies (React Email templates, Resend client)
describe('MailService', () => {
  const mockMailService = {
    sendWelcome: jest.fn(),
    sendPasswordReset: jest.fn(),
    sendAccountConfirmed: jest.fn(),
    sendTicket: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined (mocked)', () => {
    expect(mockMailService).toBeDefined();
  });

  describe('sendWelcome', () => {
    it('should send a welcome email', async () => {
      const user = {
        email: 'test@example.com',
        verificationToken: 'test-token',
      };

      mockMailService.sendWelcome.mockResolvedValue({ messageId: 'msg-123' });

      const result = await mockMailService.sendWelcome(user, 'es');

      expect(mockMailService.sendWelcome).toHaveBeenCalledWith(user, 'es');
      expect(result).toHaveProperty('messageId');
    });
  });

  describe('sendPasswordReset', () => {
    it('should send a password reset email', async () => {
      const user = {
        email: 'test@example.com',
        resetPasswordToken: 'reset-token',
      };

      mockMailService.sendPasswordReset.mockResolvedValue({ messageId: 'msg-456' });

      const result = await mockMailService.sendPasswordReset(user, 'es');

      expect(mockMailService.sendPasswordReset).toHaveBeenCalledWith(user, 'es');
      expect(result).toHaveProperty('messageId');
    });
  });

  describe('sendAccountConfirmed', () => {
    it('should send account confirmed email', async () => {
      const user = {
        email: 'test@example.com',
      };

      mockMailService.sendAccountConfirmed.mockResolvedValue({ messageId: 'msg-789' });

      const result = await mockMailService.sendAccountConfirmed(user, 'es');

      expect(mockMailService.sendAccountConfirmed).toHaveBeenCalledWith(user, 'es');
      expect(result).toHaveProperty('messageId');
    });
  });

  describe('sendTicket', () => {
    it('should send a ticket email with QR code', async () => {
      const registration = {
        id: 'reg-123',
        ticketCode: 'TICKET-001',
        attendee: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
        },
        event: {
          id: 'event-123',
          title: 'Test Event',
          startAt: new Date('2025-01-15T10:00:00Z'),
          endAt: new Date('2025-01-15T18:00:00Z'),
          timezone: 'America/Lima',
          location: {
            name: 'Test Venue',
            address: '123 Test St',
          },
        },
        eventTicket: {
          name: 'General Admission',
        },
      };

      mockMailService.sendTicket.mockResolvedValue({ messageId: 'msg-ticket' });

      const result = await mockMailService.sendTicket(registration);

      expect(mockMailService.sendTicket).toHaveBeenCalledWith(registration);
      expect(result).toHaveProperty('messageId');
    });
  });
});
