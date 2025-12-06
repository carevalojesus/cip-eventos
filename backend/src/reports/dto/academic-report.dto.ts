import { IsOptional, IsUUID } from 'class-validator';
import { BlockEnrollmentStatus } from '../../evaluations/entities/block-enrollment.entity';

export class AcademicReportFilterDto {
  @IsOptional()
  @IsUUID()
  blockId?: string;

  @IsOptional()
  @IsUUID()
  eventId?: string;

  @IsOptional()
  dateFrom?: string;

  @IsOptional()
  dateTo?: string;
}

export interface ApprovalStatusReportData {
  id: string;
  attendeeName: string;
  attendeeEmail: string;
  attendeeDocument: string;
  finalGrade: number | null;
  attendancePercentage: number;
  meetsAttendanceRequirement: boolean;
  passed: boolean;
  status: BlockEnrollmentStatus;
  certificateIssued: boolean;
  enrolledAt: Date;
  gradedAt: Date | null;
}

export interface GradeDistributionData {
  blockName: string;
  totalEnrollments: number;
  graded: number;
  pending: number;
  ranges: {
    range: string; // e.g., "0-10", "11-13", "14-16", "17-20"
    count: number;
    percentage: number;
  }[];
  statistics: {
    average: number;
    median: number;
    highest: number;
    lowest: number;
    standardDeviation: number;
    approvalRate: number; // percentage
  };
}

export interface DetailedAttendanceData {
  attendeeId: string;
  attendeeName: string;
  attendeeEmail: string;
  sessionId: string;
  sessionName: string;
  sessionDate: Date;
  status: string; // PRESENT, ABSENT, PARTIAL, LATE, EXCUSED
  modality: string; // IN_PERSON, VIRTUAL, HYBRID
  checkInAt: Date | null;
  checkOutAt: Date | null;
  minutesAttended: number;
  attendancePercentage: number;
}

export interface SessionAttendanceReportData {
  sessionId: string;
  sessionName: string;
  sessionDate: Date;
  totalEnrolled: number;
  totalPresent: number;
  totalAbsent: number;
  totalPartial: number;
  totalLate: number;
  totalExcused: number;
  attendanceRate: number; // percentage
  inPerson: number;
  virtual: number;
}
