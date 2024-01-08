import { QueryType } from '@shared/utils';
import { getErrorSchema, EndpointOptions, getSwaggerModule, type Swagger } from '../utils';

/**
 * Documents the "Get batch results" endpoint using Swagger.
 */
export const GetBatchResuls = ({ swaggerDocs }: EndpointOptions = { swaggerDocs: true }) => {
  const decorators: MethodDecorator[] = [];
  const swagger = getSwaggerModule();

  if (swaggerDocs && swagger) decorators.push(...getSwaggerDefinitions(swagger));

  return (target: any, key: any, descriptor: PropertyDescriptor) => {
    decorators.forEach((decorator) => decorator(target, key, descriptor));
  };
};

function getSwaggerDefinitions(swagger: Swagger) {
  const { ApiOkResponse, ApiQuery, ApiProduces, ApiNotFoundResponse } = swagger;

  const queryType = ApiQuery({ name: 'type', required: false, enum: QueryType });
  const header = ApiProduces('application/json', 'application/octet-stream', 'text/csv');

  const NotFound = ApiNotFoundResponse({
    description: 'Batch ID not found',
    schema: getErrorSchema({ status: 404, message: 'no results found for batch_id <id>' }),
  });

  const Ok = ApiOkResponse({ description: 'Batch results', schema: getOkSchema() });

  return [queryType, header, NotFound, Ok];
}

function getOkSchema() {
  return {
    oneOf: [
      {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            inputs: {
              type: 'object',
              description: 'execution inputs',
              example: { a: 1, b: 2 },
            },
            outputs: {
              type: 'object',
              description: 'execution outputs',
              example: { c: 3 },
            },
            executed_at: {
              type: 'string',
              description: 'execution date',
              example: '2021-01-31T00:00:00.000Z',
            },
            duration: {
              type: 'number',
              description: 'execution time in milliseconds',
              example: 1.72,
            },
          },
        },
      },
      {
        type: 'string',
        format: 'binary',
        description: 'CSV file',
      },
    ],
  };
}
