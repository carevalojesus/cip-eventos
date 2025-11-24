import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { MailService } from './mail/mail.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly mailService: MailService,
  ) {}

  @Get('test-email')
  async testEmail() {
    await this.mailService.sendUserWelcome(
      'test@example.com',
      'Test User',
      'sample-token',
    );
    return 'Test email sent';
  }

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
}
