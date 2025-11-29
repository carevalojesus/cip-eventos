import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService } from '../../mail/mail.service';
import { RegistrationsService } from '../../registrations/registrations.service';
import { QUEUE_NAMES } from '../constants';
import { EmailJob, EmailJobType } from '../types/email-jobs.types';

@Processor(QUEUE_NAMES.EMAIL)
export class EmailProcessor extends WorkerHost {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly mailService: MailService,
    @Inject(forwardRef(() => RegistrationsService))
    private readonly registrationsService: RegistrationsService,
  ) {
    super();
  }

  async process(job: Job<EmailJob>): Promise<void> {
    this.logger.log(`Processing email job ${job.id} of type ${job.data.type}`);

    try {
      switch (job.data.type) {
        case EmailJobType.WELCOME:
          await this.mailService.sendUserWelcome(
            job.data.data.email,
            job.data.data.name,
            job.data.data.token,
          );
          break;

        case EmailJobType.PASSWORD_RESET:
          await this.mailService.sendPasswordReset(
            job.data.data.email,
            job.data.data.name,
            job.data.data.token,
          );
          break;

        case EmailJobType.ACCOUNT_CONFIRMED:
          await this.mailService.sendAccountConfirmed(
            job.data.data.email,
            job.data.data.name,
          );
          break;

        case EmailJobType.TICKET:
          const registration = await this.registrationsService.findOne(
            job.data.data.registrationId,
          );
          if (registration) {
            await this.mailService.sendTicket(registration);
          } else {
            throw new Error(`Registration ${job.data.data.registrationId} not found`);
          }
          break;

        default:
          this.logger.warn(`Unknown email job type: ${(job.data as any).type}`);
      }

      this.logger.log(`Email job ${job.id} completed successfully`);
    } catch (error) {
      this.logger.error(`Email job ${job.id} failed: ${error.message}`);
      throw error; // Re-throw para que BullMQ maneje el retry
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.debug(`Job ${job.id} completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(`Job ${job.id} failed after ${job.attemptsMade} attempts: ${error.message}`);
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string) {
    this.logger.warn(`Job ${jobId} stalled`);
  }
}
