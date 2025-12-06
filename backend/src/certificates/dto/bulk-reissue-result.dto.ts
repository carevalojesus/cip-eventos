export interface BulkReissueResultItem {
  certificateId: string;
  success: boolean;
  error?: string;
  newVersion?: number;
}

export class BulkReissueResultDto {
  total: number;
  successful: number;
  failed: number;
  results: BulkReissueResultItem[];
}
