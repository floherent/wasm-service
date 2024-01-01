import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger, HttpStatus } from '@nestjs/common';
import { ValidationPipe, ValidationError } from '@nestjs/common';
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
      const message = status === HttpStatus.SERVICE_UNAVAILABLE ? 'service unhealthy' : exception.message;
      const cause = status === HttpStatus.SERVICE_UNAVAILABLE ? exception.getResponse()['error'] : exception.cause;
      error = { status, message, cause };
    } else {
      const status = exception['status'] ?? exception['statusCode'] ?? exception['code']; // possibly of http-errors exception
      const message = exception['message'] ?? exception['error'] ?? exception['name'];
      error = new ApiException(status, message, exception).getResponse() as ApiError;
    }

    Logger.error(error.message, 'ApiExceptionFilter');
    response.status(error.status).json({ error });
  }
}

export const ApiValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  exceptionFactory: (errors: ValidationError[]) => {
    return new ApiException(
      HttpStatus.BAD_REQUEST,
      'validation failed',
      errors.reduce((acc, cur) => ({ ...acc, [cur.property]: Object.values(cur.constraints) }), {}),
    );
  },
});
