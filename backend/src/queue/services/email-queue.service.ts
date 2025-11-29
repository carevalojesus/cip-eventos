import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { QUEUE_NAMES } from '../constants';
import { EmailJob, EmailJobType } from '../types/email-jobs.types';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);

  constructor(
    @InjectQueue(QUEUE_NAMES.EMAIL) private readonly emailQueue: Queue,
  ) {}

  /**
   * Encolar email de bienvenida
   */
  async queueWelcomeEmail(email: string, name: string, token: string) {
    const job: EmailJob = {
      type: EmailJobType.WELCOME,
      data: { email, name, token },
    };

    await this.emailQueue.add(EmailJobType.WELCOME, job, {
      priority: 1, // Alta prioridad
    });

    this.logger.log(`Welcome email queued for ${email}`);
  }

  /**
   * Encolar email de reset de password
   */
  async queuePasswordResetEmail(email: string, name: string, token: string) {
    const job: EmailJob = {
      type: EmailJobType.PASSWORD_RESET,
      data: { email, name, token },
    };

    await this.emailQueue.add(EmailJobType.PASSWORD_RESET, job, {
      priority: 1, // Alta prioridad
    });

    this.logger.log(`Password reset email queued for ${email}`);
  }

  /**
   * Encolar email de cuenta confirmada
   */
  async queueAccountConfirmedEmail(email: string, name: string) {
    const job: EmailJob = {
      type: EmailJobType.ACCOUNT_CONFIRMED,
      data: { email, name },
    };

    await this.emailQueue.add(EmailJobType.ACCOUNT_CONFIRMED, job, {
      priority: 2, // Prioridad media
    });

    this.logger.log(`Account confirmed email queued for ${email}`);
  }

  /**
   * Encolar email de ticket
   */
  async queueTicketEmail(registrationId: string) {
    const job: EmailJob = {
      type: EmailJobType.TICKET,
      data: { registrationId },
    };

    await this.emailQueue.add(EmailJobType.TICKET, job, {
      priority: 2, // Prioridad media
    });

    this.logger.log(`Ticket email queued for registration ${registrationId}`);
  }

  /**
   * Obtener estadísticas de la cola
   */
  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.emailQueue.getWaitingCount(),
      this.emailQueue.getActiveCount(),
      this.emailQueue.getCompletedCount(),
      this.emailQueue.getFailedCount(),
      this.emailQueue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }
}
