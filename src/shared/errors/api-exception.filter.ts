import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';

import { ApiException } from './api-error';

@Catch(HttpException)
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    const error =
      exception instanceof ApiException
        ? exception.getResponse()
        : {
            status: status === HttpStatus.INTERNAL_SERVER_ERROR ? HttpStatus.UNPROCESSABLE_ENTITY : status,
            message: exception.message,
            code: 'UNABLE_TO_PROCESS_REQUEST',
            cause: exception.cause ?? undefined,
          };

    Logger.error(error, exception.stack, 'ApiExceptionFilter');
    response.status(status).json({ error });
  }
}
