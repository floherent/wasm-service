import { getBatchSchema, getErrorSchema, EndpointOptions, getSwaggerModule, type Swagger } from '../utils';

/**
 * Documents the "Create batch" endpoint using Swagger.
 */
export const CreateBatch = ({ swaggerDocs }: EndpointOptions = { swaggerDocs: true }) => {
  const decorators: MethodDecorator[] = [];
  const swagger = getSwaggerModule();

  if (swaggerDocs && swagger) decorators.push(...getSwaggerDefinitions(swagger));

  return (target: any, key: any, descriptor: PropertyDescriptor) => {
    decorators.forEach((decorator) => decorator(target, key, descriptor));
  };
};

function getSwaggerDefinitions(swagger: Swagger) {
  const { ApiCreatedResponse, ApiUnprocessableEntityResponse, ApiParam, ApiBody, ApiHeader } = swagger;
  const { ApiTooManyRequestsResponse, ApiNotFoundResponse, ApiPayloadTooLargeResponse } = swagger;

  const param = ApiParam({ name: 'service_id', description: 'wasm bundle id', format: 'uuid' });
  const body = ApiBody({ description: 'Batch of records to execute asynchronously', schema: getBodySchema() });
  const header = ApiHeader({ name: 'Ws-Client-Id', description: 'web socket client id', required: false });

  const BadRequest = swagger.ApiBadRequestResponse({
    description: 'Bad request',
    schema: getErrorSchema({
      status: 400,
      message: 'validation failed',
      cause: { inputs: ['must be a valid object'] },
    }),
  });

  const NotFound = ApiNotFoundResponse({
    description: 'WASM bundle not found',
    schema: getErrorSchema({ status: 404, message: 'WASM bundle not found' }),
  });

  const TooManyRequests = ApiTooManyRequestsResponse({
    description: 'Batch limit exceeded',
    schema: getErrorSchema({ status: 429, message: 'rate limit exceeded' }),
  });

  const PayloadTooLarge = ApiPayloadTooLargeResponse({
    description: 'Payload too large',
    schema: getErrorSchema({
      status: 413,
      message: 'request entity too large',
      cause: { length: 1843, limit: 1024 },
    }),
  });

  const Unprocessable = ApiUnprocessableEntityResponse({
    description: 'Unable to create batch',
    schema: getErrorSchema({ status: 422, message: 'failed to save batch submission for wasm <id>' }),
  });

  const Ok = ApiCreatedResponse({ description: 'Batch operation created successfully', schema: getBatchSchema() });

  return [param, header, body, BadRequest, NotFound, PayloadTooLarge, TooManyRequests, Unprocessable, Ok];
}

function getBodySchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['inputs'],
    properties: {
      inputs: {
        description: 'corresponding inputs',
        oneOf: [
          {
            type: 'array',
            description: 'useful for synchronous batch execution using JSON data',
            items: { type: 'object' },
            example: [{ foo: 'bar' }, { bar: 'foo' }],
          },
          {
            type: 'array',
            description: 'useful for synchronous batch execution using COLUMNAR data',
            items: { type: 'array', minItems: 2 },
            example: [
              ['one', 'two'],
              [1, 2],
              [3, 4],
            ],
          },
        ],
      },
      shared: {
        description: 'shared data to extend every input of a batch execution',
        oneOf: [{ type: 'null', example: null }, { type: 'object' }],
      },
    },
  };
}
