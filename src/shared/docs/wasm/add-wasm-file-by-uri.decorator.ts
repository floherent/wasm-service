import { getWasmDataSchema, getErrorSchema, EndpointOptions, getSwaggerModule, type Swagger } from '../utils';

/**
 * Documents the "Add WASM file by URI" endpoint using Swagger.
 */
export const AddWasmFileByUri = ({ swaggerDocs }: EndpointOptions = { swaggerDocs: true }) => {
  const decorators: MethodDecorator[] = [];
  const swagger = getSwaggerModule();

  if (swaggerDocs && swagger) decorators.push(...getSwaggerDefinitions(swagger));

  return (target: any, key: any, descriptor: PropertyDescriptor) => {
    decorators.forEach((decorator) => decorator(target, key, descriptor));
  };
};

function getSwaggerDefinitions(swagger: Swagger) {
  const { ApiQuery, ApiParam, ApiBody } = swagger;
  const { ApiCreatedResponse, ApiBadRequestResponse, ApiUnprocessableEntityResponse } = swagger;

  const param = ApiParam({ name: 'version_id', description: 'wasm bundle id', format: 'uuid', required: false });
  const query = ApiQuery({ name: 'preload', type: Boolean, required: false, example: false });
  const body = ApiBody({ description: 'Upload a WASM bundle by URI', schema: getBodySchema() });

  const BadRequest = ApiBadRequestResponse({
    description: 'Bad request',
    schema: getErrorSchema({ status: 400, message: 'cannot download wasm from <url>', cause: 'invalid url' }),
  });

  const Unprocessable = ApiUnprocessableEntityResponse({
    description: 'Unable to create wasm runner',
    schema: getErrorSchema({ status: 422, message: 'failed to create wasm runner' }),
  });

  const Ok = ApiCreatedResponse({ description: 'WASM file uploaded successfully', schema: getWasmDataSchema() });

  return [param, query, body, BadRequest, Unprocessable, Ok];
}

function getBodySchema() {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['url'],
    properties: {
      url: {
        type: 'string',
        format: 'url',
        description: 'where to download the wasm file from',
        example: 'https://example.com/wasm.zip',
      },
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
  };
}
