import { getWasmDataSchema, getErrorSchema, EndpointOptions, getSwaggerModule, type Swagger } from '../utils';

/**
 * Documents the "Upload WASM file" endpoint using Swagger.
 */
export const UploadWasmFile = ({ swaggerDocs }: EndpointOptions = { swaggerDocs: true }) => {
  const decorators: MethodDecorator[] = [];
  const swagger = getSwaggerModule();

  if (swaggerDocs && swagger) decorators.push(...getSwaggerDefinitions(swagger));

  return (target: any, key: any, descriptor: PropertyDescriptor) => {
    decorators.forEach((decorator) => decorator(target, key, descriptor));
  };
};

function getSwaggerDefinitions(swagger: Swagger) {
  const { ApiCreatedResponse, ApiUnprocessableEntityResponse, ApiQuery, ApiParam, ApiConsumes, ApiBody } = swagger;
  const { ApiBadRequestResponse } = swagger;

  const param = ApiParam({ name: 'version_id', description: 'wasm bundle id', format: 'uuid', required: false });
  const query = ApiQuery({ name: 'preload', type: Boolean, required: false, example: false });
  const header = ApiConsumes('multipart/form-data');
  const body = ApiBody({ description: 'Upload a WASM bundle', schema: getBodySchema() });

  const Unprocessable = ApiUnprocessableEntityResponse({
    description: 'Unable to create wasm runner',
    schema: getErrorSchema({ status: 422, message: 'failed to create wasm runner' }),
  });

  const BadRequest = ApiBadRequestResponse({
    description: 'Bad request',
    schema: getErrorSchema({ status: 400, message: 'File is required' }),
  });

  const Ok = ApiCreatedResponse({
    description: 'WASM file uploaded successfully',
    schema: getWasmDataSchema(),
  });

  return [param, query, header, body, BadRequest, Unprocessable, Ok];
}

function getBodySchema() {
  return {
    type: 'object',
    required: ['wasm', 'data'],
    additionalProperties: false,
    properties: {
      wasm: {
        type: 'string',
        format: 'binary',
        description: 'WASM bundle',
      },
      data: {
        type: 'object',
        description: 'additional data to be stored with the wasm file',
        additionalProperties: false,
        properties: {
          service_name: {
            type: 'string',
            description: 'name of the service',
            example: 'Pet Rater',
          },
          revision: {
            type: 'string',
            example: '1.0.0',
          },
          username: {
            type: 'string',
            example: 'john.doe@example.com',
          },
        },
      },
    },
  };
}
