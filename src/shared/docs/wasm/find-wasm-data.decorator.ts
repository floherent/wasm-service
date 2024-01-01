import { SortOrder } from '@shared/utils';
import { EndpointOptions, getSwaggerModule, type Swagger } from '../utils';
import { getWasmDataSchema, getPaginationSchema, getErrorSchema } from '../utils';

/**
 * Documents the "Find WASM data" endpoint using Swagger.
 */
export const FindWasmData = ({ swaggerDocs }: EndpointOptions = { swaggerDocs: true }) => {
  const decorators: MethodDecorator[] = [];
  const swagger = getSwaggerModule();

  if (swaggerDocs && swagger) decorators.push(...getSwaggerDefinitions(swagger));

  return (target: any, key: any, descriptor: PropertyDescriptor) => {
    decorators.forEach((decorator) => decorator(target, key, descriptor));
  };
};

function getSwaggerDefinitions(swagger: Swagger) {
  const { ApiOkResponse, ApiUnprocessableEntityResponse, ApiQuery } = swagger;

  const page = ApiQuery({ name: 'page', required: false, example: 1 });
  const limit = ApiQuery({ name: 'limit', required: false, example: 100 });
  const order = ApiQuery({ name: 'order', required: false, enum: SortOrder });

  const Unprocessable = ApiUnprocessableEntityResponse({
    description: 'Unable to find WASM data',
    schema: getErrorSchema({ status: 422, message: 'Unable to process the request' }),
  });

  const Ok = ApiOkResponse({
    description: 'List of uploaded wasms files',
    schema: getOkSchema(),
  });

  return [page, limit, order, Unprocessable, Ok];
}

function getOkSchema() {
  return {
    type: 'object',
    required: ['content', 'pagination'],
    additionalProperties: false,
    properties: {
      content: {
        type: 'array',
        items: getWasmDataSchema(),
      },
      pagination: getPaginationSchema(),
    },
  };
}
