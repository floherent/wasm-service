import { getErrorSchema, EndpointOptions, getSwaggerModule, type Swagger } from '../utils';

/**
 * Documents the "Download WASM file" endpoint using Swagger.
 */
export const DownloadWasmFile = ({ swaggerDocs }: EndpointOptions = { swaggerDocs: true }) => {
  const decorators: MethodDecorator[] = [];
  const swagger = getSwaggerModule();

  if (swaggerDocs && swagger) decorators.push(...getSwaggerDefinitions(swagger));

  return (target: any, key: any, descriptor: PropertyDescriptor) => {
    decorators.forEach((decorator) => decorator(target, key, descriptor));
  };
};

function getSwaggerDefinitions(swagger: Swagger) {
  const { ApiProduces, ApiOkResponse, ApiNotFoundResponse } = swagger;

  const header = ApiProduces('application/octet-stream', 'application/zip');
  const NotFound = ApiNotFoundResponse({
    description: 'WASM file not found',
    schema: getErrorSchema({ status: 404, message: 'no wasm file found for version_id <id>' }),
  });

  const Ok = ApiOkResponse({
    description: 'WASM file downloaded successfully',
    type: 'binary',
    schema: {
      type: 'string',
      format: 'binary',
      description: 'WASM file as zip',
    },
  });

  return [header, NotFound, Ok];
}
