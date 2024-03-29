import { SortOrder, QueryType } from '@shared/utils';
import { getErrorSchema, getPaginationSchema, EndpointOptions, getSwaggerModule, type Swagger } from '../utils';

/**
 * Documents the "Get WASM execution history" endpoint using Swagger.
 */
export const GetWasmExecHistory = ({ swaggerDocs }: EndpointOptions = { swaggerDocs: true }) => {
  const decorators: MethodDecorator[] = [];
  const swagger = getSwaggerModule();

  if (swaggerDocs && swagger) decorators.push(...getSwaggerDefinitions(swagger));

  return (target: any, key: any, descriptor: PropertyDescriptor) => {
    decorators.forEach((decorator) => decorator(target, key, descriptor));
  };
};

function getSwaggerDefinitions(swagger: Swagger) {
  const { ApiOkResponse, ApiQuery, ApiProduces, ApiNotFoundResponse } = swagger;

  const page = ApiQuery({ name: 'page', required: false, example: 1 });
  const limit = ApiQuery({ name: 'limit', required: false, example: 100 });
  const order = ApiQuery({ name: 'order', required: false, enum: SortOrder });
  const queryType = ApiQuery({ name: 'type', required: false, enum: QueryType, description: 'data by default' });
  const header = ApiProduces('application/json', 'application/octet-stream', 'text/csv');

  const NotFound = ApiNotFoundResponse({
    description: 'No execution history found',
    schema: getErrorSchema({ status: 404, message: 'no execution history file found for version_id <id>' }),
  });

  const Ok = ApiOkResponse({ description: 'WASM execution history', schema: getOkSchema() });

  return [page, limit, order, queryType, header, NotFound, Ok];
}

function getOkSchema() {
  return {
    oneOf: [
      {
        type: 'object',
        required: ['content', 'pagination'],
        additionalProperties: false,
        properties: {
          content: {
            type: 'array',
            items: {
              type: 'object',
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
          pagination: getPaginationSchema(),
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
