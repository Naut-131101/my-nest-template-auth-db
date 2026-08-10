import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { NextFunction, Request, Response } from 'express';

export type RequestWithId = Request & { requestId: string };

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(request: Request, response: Response, next: NextFunction): void {
    const incomingRequestId = request.header('x-request-id');
    const requestId = incomingRequestId?.trim() || randomUUID();

    (request as RequestWithId).requestId = requestId;
    response.setHeader('x-request-id', requestId);
    next();
  }
}
