export interface CreateAuditLogDto {
  requestId: string;
  actorId?: string;
  actorEmail?: string;
  actorRole?: string;
  action: string;
  method: string;
  path: string;
  statusCode: number;
  success: boolean;
  ip?: string;
  userAgent?: string;
  durationMs: number;
  metadata?: Record<string, unknown>;
  errorName?: string;
  errorMessage?: string;
  occurredAt: Date;
}
