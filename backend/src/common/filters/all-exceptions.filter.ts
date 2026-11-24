import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details: string[];
  };
}

/** Turns every error into the same shape and hides internal details from clients. */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = getStatus(exception);

    // Only unexpected errors are logged with a stack. 4xx errors are client mistakes.
    if (status >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json(toErrorResponse(exception, status));
  }
}

function getStatus(exception: unknown): number {
  if (exception instanceof HttpException) {
    return exception.getStatus();
  }
  // Express middleware (such as the body parser) throws plain errors with a statusCode.
  if (exception instanceof Error && 'statusCode' in exception) {
    const { statusCode } = exception;
    if (
      typeof statusCode === 'number' &&
      statusCode >= 400 &&
      statusCode < 500
    ) {
      return statusCode;
    }
  }
  return HttpStatus.INTERNAL_SERVER_ERROR;
}

function toErrorResponse(exception: unknown, status: number): ErrorResponse {
  const code = HttpStatus[status] ?? 'ERROR';

  if (status >= 500) {
    const message = 'Something went wrong. Please try again later.';
    return { error: { code, message, details: [] } };
  }

  // ValidationPipe reports one message per invalid field.
  const validationMessages = getValidationMessages(exception);
  if (validationMessages) {
    return {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: validationMessages,
      },
    };
  }

  const message =
    exception instanceof Error ? exception.message : 'Request failed';
  return { error: { code, message, details: [] } };
}

function getValidationMessages(exception: unknown): string[] | null {
  if (!(exception instanceof HttpException)) return null;

  const body = exception.getResponse();
  if (typeof body === 'string' || !('message' in body)) return null;

  return Array.isArray(body.message) ? body.message.map(String) : null;
}
