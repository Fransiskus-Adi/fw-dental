import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { RequestHandler, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
import { EventLogService } from './event-log.service';

@Catch()
export class HttpLoggingFilter extends BaseExceptionFilter {
  catch(error: unknown, host: ArgumentsHost): void {
    host.switchToHttp().getResponse<Response>().locals.logErrorType =
      error instanceof Error ? error.constructor.name : 'UnknownError';
    // Never log raw database parameters or request content in unexpected exceptions.
    if (error instanceof HttpException) {
      super.catch(error, host);
      return;
    }
    const reportedStatus = (error as { statusCode?: unknown } | null)?.statusCode;
    const status = typeof reportedStatus === 'number' && Number.isInteger(reportedStatus) &&
      reportedStatus >= 400 && reportedStatus < 500 ? reportedStatus : 500;
    super.catch(new HttpException(status === 500 ? 'Internal server error' : 'Invalid request', status), host);
  }
}

export function logHttpRequests(events: EventLogService): RequestHandler {
  return (request, response, next) => {
    const requestId = randomUUID();
    const start = performance.now();
    response.setHeader('X-Request-ID', requestId);

    response.once('close', () => {
      const completed = response.writableFinished;
      const status = response.headersSent ? response.statusCode : undefined;
      const route: unknown = request.route?.path;
      const errorType: unknown = response.locals.logErrorType;
      let level: 'info' | 'warn' | 'error' = 'info';
      if (status !== undefined && status >= 500) {
        level = 'error';
      } else if (!completed || (status !== undefined && status >= 400)) {
        level = 'warn';
      }
      events.record({
        event: completed ? 'http.request' : 'http.aborted',
        level,
        requestId,
        method: request.method,
        route: typeof route === 'string' ? route : undefined,
        httpStatus: status,
        durationMs: performance.now() - start,
        errorType: typeof errorType === 'string' ? errorType : undefined,
      });
    });

    next();
  };
}
