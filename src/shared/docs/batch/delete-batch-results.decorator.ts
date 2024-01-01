import { getErrorSchema, EndpointOptions, getSwaggerModule, type Swagger } from '../utils';

/**
 * Documents the "Delete batch files" endpoint using Swagger.
 */
export const DeleteBatchFiles = ({ swaggerDocs }: EndpointOptions = { swaggerDocs: true }) => {
  const decorators: MethodDecorator[] = [];
  const swagger = getSwaggerModule();

  if (swaggerDocs && swagger) decorators.push(...getSwaggerDefinitions(swagger));

  return (target: any, key: any, descriptor: PropertyDescriptor) => {
    decorators.forEach((decorator) => decorator(target, key, descriptor));
  };
};

function getSwaggerDefinitions(swagger: Swagger) {
  const { ApiNoContentResponse, ApiTooManyRequestsResponse, ApiBadRequestResponse, ApiBody } = swagger;

  const body = ApiBody({
    description: 'set of batch IDs to delete',
    schema: {
      type: 'object',
      additionalProperties: false,
      required: ['ids'],
      properties: {
        ids: {
          type: 'array',
          description: 'list of batch IDs to delete',
          items: { type: 'string', format: 'uuid' },
          example: ['f1c1f3a0-8f0f-4d2b-9e4d-1d3e5f2a3b7c', 'f1c1f3a0-8f0f-4d2b-9e4d-1d3e5f2a3b7c'],
        },
      },
    },
  });

  const BadRequest = ApiBadRequestResponse({
    description: 'Invalid request body',
    schema: getErrorSchema({
      status: 400,
      message: 'validation failed',
      cause: { ids: ['ids must contain at least 1 elements'] },
    }),
  });

  const TooManyRequests = ApiTooManyRequestsResponse({
    description: 'Batch limit exceeded',
    schema: getErrorSchema({ status: 429, message: 'rate limit exceeded' }),
  });

  const Ok = ApiNoContentResponse({ description: 'Batch files deleted successfully' });

  return [body, BadRequest, TooManyRequests, Ok];
}
