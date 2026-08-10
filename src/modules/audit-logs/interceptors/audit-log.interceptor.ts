import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { AuthenticatedUser } from '../../../common/interfaces/authenticated-user.interface';
import { RequestWithId } from '../../../common/middleware/request-id.middleware';
import { AUDIT_ACTION_KEY } from '../decorators/audit-action.decorator';
import { SKIP_AUDIT_KEY } from '../decorators/skip-audit.decorator';
import { AuditLogsService } from '../audit-logs.service';

type AuditedRequest = RequestWithId & { user?: AuthenticatedUser };

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly auditedMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

  constructor(
    private readonly reflector: Reflector,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const skipAudit = this.reflector.getAllAndOverride<boolean>(SKIP_AUDIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<AuditedRequest>();
    if (skipAudit || !this.auditedMethods.has(request.method)) {
      return next.handle();
    }

    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();
    const action =
      this.reflector.getAllAndOverride<string>(AUDIT_ACTION_KEY, [
        context.getHandler(),
        context.getClass(),
      ]) ?? `${request.method.toLowerCase()}:${request.path}`;

    return next.handle().pipe(
      tap(() => {
        this.writeAuditLog({
          request,
          response,
          action,
          startedAt,
          success: true,
          statusCode: response.statusCode,
        });
      }),
      catchError((error: unknown) => {
        const statusCode =
          error instanceof HttpException ? error.getStatus() : 500;

        this.writeAuditLog({
          request,
          response,
          action,
          startedAt,
          success: false,
          statusCode,
          error,
        });

        return throwError(() => error);
      }),
    );
  }

  private writeAuditLog(input: {
    request: AuditedRequest;
    response: Response;
    action: string;
    startedAt: number;
    success: boolean;
    statusCode: number;
    error?: unknown;
  }): void {
    const { request, action, startedAt, success, statusCode, error } = input;
    const normalizedError = this.normalizeError(error);

    void this.auditLogsService
      .create({
        requestId: request.requestId,
        actorId: request.user?.id,
        actorEmail: request.user?.email,
        actorRole: request.user?.role,
        action,
        method: request.method,
        path: request.originalUrl,
        statusCode,
        success,
        ip: request.ip,
        userAgent: request.get('user-agent'),
        durationMs: Date.now() - startedAt,
        errorName: normalizedError?.name,
        errorMessage: normalizedError?.message,
        occurredAt: new Date(),
      })
      .catch((auditError: unknown) => {
        console.error('Không thể ghi audit log', auditError);
      });
  }

  private normalizeError(
    error: unknown,
  ): { name: string; message: string } | undefined {
    if (error instanceof Error) {
      return { name: error.name, message: error.message };
    }
    return error === undefined
      ? undefined
      : { name: 'UnknownError', message: String(error) };
  }
}
