import { getErrorSchema, EndpointOptions, getSwaggerModule, type Swagger } from '../utils';

/**
 * Documents the "Execute WASM" endpoint using Swagger.
 */
export const ExecuteWasm = ({ swaggerDocs }: EndpointOptions = { swaggerDocs: true }) => {
  const decorators: MethodDecorator[] = [];
  const swagger = getSwaggerModule();

  if (swaggerDocs && swagger) decorators.push(...getSwaggerDefinitions(swagger));

  return (target: any, key: any, descriptor: PropertyDescriptor) => {
    decorators.forEach((decorator) => decorator(target, key, descriptor));
  };
};

function getSwaggerDefinitions(swagger: Swagger) {
  const { ApiBody, ApiOkResponse, ApiBadRequestResponse, ApiNotFoundResponse } = swagger;
  const { ApiUnprocessableEntityResponse, ApiPayloadTooLargeResponse } = swagger;

  const body = ApiBody({ description: 'Upload a WASM bundle by URI', schema: getBodySchema() });

  const NotFound = ApiNotFoundResponse({
    description: 'WASM not found',
    schema: getErrorSchema({ status: 404, message: 'no wasm file found for version_id <id>' }),
  });

  const BadRequest = ApiBadRequestResponse({
    description: 'Bad request',
    schema: getErrorSchema({
      status: 400,
      message: 'validation failed',
      cause: { inputs: ['must be a valid object'] },
    }),
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
    description: 'Unable to execute WASM bundle',
    schema: getErrorSchema({ status: 422, message: 'failed to save wasm execution history <id>' }),
  });

  const Ok = ApiOkResponse({ description: 'WASM executed successfully', schema: getOkSchema() });

  return [body, PayloadTooLarge, NotFound, BadRequest, Unprocessable, Ok];
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
          { type: 'object', example: { a: 1, b: 2 } },
          {
            type: 'array',
            description: 'useful for synchronous batch execution using JSON data',
            items: { type: 'object' },
            example: [{ a: 1 }, { b: 2 }, { c: 3 }],
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
      metadata: { description: 'additional request metadata', type: 'object' },
      shared: {
        description: 'shared data to extend every input of a batch execution',
        oneOf: [{ type: 'null', example: null }, { type: 'object' }],
      },
    },
  };
}

function getOkSchema() {
  return {
    description: 'corresponding outputs',
    oneOf: [
      {
        type: 'object',
        additionalProperties: false,
        required: ['response_data', 'response_meta'],
        properties: {
          response_data: {
            type: 'object',
            properties: {
              outputs: { type: 'object', example: { c: 3 } },
              errors: { type: 'array', example: [] },
              warnings: { type: 'array', example: [] },
              service_chain: { type: 'array', example: [] },
            },
          },
          response_meta: {
            type: 'object',
            properties: {
              version_id: { type: 'string' },
              correlation_id: { type: 'string' },
              service_category: { type: 'string' },
              system: { type: 'string' },
              compiler_version: { type: 'string' },
              process_time: { type: 'number' },
            },
          },
        },
      },
      {
        type: 'object',
        properties: {
          version_id: { type: 'string' },
          executed_at: { type: 'string', format: 'date-time' },
          duration: { type: 'number' },
          exec_times: { type: 'array', items: { type: 'number' } },
          inputs: { type: 'array', items: { type: 'object' } },
          outputs: { type: 'array', items: { type: 'object' } },
          errors: { type: 'array', items: { type: 'object' } },
          warnings: { type: 'array', items: { type: 'object' } },
          compiler_version: { type: 'string' },
          system: { type: 'string' },
        },
      },
    ],
  };
}
