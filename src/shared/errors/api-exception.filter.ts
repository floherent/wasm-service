import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

import { ApiException, ApiError } from './api-error';

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    let error: ApiError;

    if (exception instanceof ApiException) {
      error = exception.getResponse() as ApiError;
    } else if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const cause = status === HttpStatus.SERVICE_UNAVAILABLE ? exception.getResponse()['error'] : exception.cause;
      const message = status === HttpStatus.SERVICE_UNAVAILABLE ? 'Service unhealthy' : exception.message;
      error = { status, message, cause };
    } else {
      error = new ApiException(null, null, exception).getResponse() as ApiError;
    }

    Logger.error(error.message, 'ApiExceptionFilter');
    response.status(error.status).json({ error });
  }
}
