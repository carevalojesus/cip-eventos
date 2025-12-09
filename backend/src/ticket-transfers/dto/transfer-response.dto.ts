import { TransferStatus } from '../enums/transfer-status.enum';

export class TransferResponseDto {
  id: string;
  status: TransferStatus;
  registrationId: string;
  fromAttendeeName: string;
  toAttendeeName: string;
  reason: string | null;
  rejectionReason: string | null;
  createdAt: Date;
  completedAt: Date | null;
  eventName: string;
  ticketName: string;
}
