import { getErrorSchema, EndpointOptions, getSwaggerModule, type Swagger } from '../utils';

/**
 * Documents the "Delete WASM file" endpoint using Swagger.
 */
export const DeleteWasmFile = ({ swaggerDocs }: EndpointOptions = { swaggerDocs: true }) => {
  const decorators: MethodDecorator[] = [];
  const swagger = getSwaggerModule();

  if (swaggerDocs && swagger) decorators.push(...getSwaggerDefinitions(swagger));

  return (target: any, key: any, descriptor: PropertyDescriptor) => {
    decorators.forEach((decorator) => decorator(target, key, descriptor));
  };
};

function getSwaggerDefinitions(swagger: Swagger) {
  const { ApiNoContentResponse, ApiNotFoundResponse } = swagger;

  const NotFound = ApiNotFoundResponse({
    description: 'WASM not found',
    schema: getErrorSchema({ status: 404, message: 'no wasm file found for version_id <id>' }),
  });

  const Ok = ApiNoContentResponse({ description: 'WASM deleted successfully' });

  return [NotFound, Ok];
}
