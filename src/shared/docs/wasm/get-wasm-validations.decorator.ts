import { EndpointOptions, getSwaggerModule, type Swagger } from '../utils';
import { getErrorSchema } from '../utils';

/**
 * Documents the "Get WASM validations" endpoint using Swagger.
 */
export const GetWasmValidations = ({ swaggerDocs }: EndpointOptions = { swaggerDocs: true }) => {
  const decorators: MethodDecorator[] = [];
  const swagger = getSwaggerModule();

  if (swaggerDocs && swagger) decorators.push(...getSwaggerDefinitions(swagger));

  return (target: any, key: any, descriptor: PropertyDescriptor) => {
    decorators.forEach((decorator) => decorator(target, key, descriptor));
  };
};

function getSwaggerDefinitions(swagger: Swagger) {
  const { ApiOkResponse, ApiNotFoundResponse } = swagger;

  const NotFound = ApiNotFoundResponse({
    description: 'WASM not found',
    schema: getErrorSchema({ status: 404, message: 'no wasm file found for version_id <id>' }),
  });

  const Ok = ApiOkResponse({
    description: 'WASM validations',
    schema: getOkSchema(),
  });

  return [NotFound, Ok];
}

function getOkSchema() {
  return {
    type: 'object',
    description: 'WASM validations',
    required: ['status', 'response_data', 'response_meta'],
    additionalProperties: false,
    properties: {
      status: { type: 'string' },
      response_data: {
        type: 'object',
        required: ['outputs', 'warnings', 'errors', 'service_chain'],
        properties: {
          outputs: { type: 'object', description: 'List of validations' },
          warnings: { type: 'array', nullable: true },
          errors: { type: 'array', nullable: true },
          service_chain: { type: 'array', nullable: true },
        },
      },
      response_meta: {
        type: 'object',
        required: ['version_id'],
        properties: {
          version_id: { type: 'string', description: 'The version ID of the WASM' },
        },
      },
      error: {
        type: 'object',
        nullable: true,
      },
    },
  };
}
