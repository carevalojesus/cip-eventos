import api from "@/lib/api";

export interface AuditLog {
  id: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'REVOKE' | 'RESTORE' | 'REISSUE' | 'MERGE' | 'TRANSFER';
  previousValues: Record<string, any> | null;
  newValues: Record<string, any> | null;
  changedFields: string[] | null;
  performedBy: { id: string; email: string } | null;
  performedByEmail: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  reason: string | null;
  metadata: Record<string, any> | null;
  createdAt: string;
}

export interface AuditLogResponse {
  data: AuditLog[];
  total: number;
  pages: number;
}

export const auditService = {
  async getByUserId(userId: string, page: number = 1, limit: number = 10): Promise<AuditLogResponse> {
    const response = await api.get<AuditLogResponse>(`/audit/user/${userId}`, {
      params: { page, limit },
    });
    return response.data;
  },
};
