export class TransferValidationDto {
  canTransfer: boolean;
  reason: string;
  deadline: Date | null;
  allowsTransfer: boolean;
  hasAttendance: boolean;
  isConfirmed: boolean;
  isDeadlinePassed: boolean;
}
