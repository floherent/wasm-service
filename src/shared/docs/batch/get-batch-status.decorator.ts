import { getBatchSchema, getErrorSchema, EndpointOptions, getSwaggerModule, type Swagger } from '../utils';

/**
 * Documents the "Get batch status" endpoint using Swagger.
 */
export const GetBatchStatus = ({ swaggerDocs }: EndpointOptions = { swaggerDocs: true }) => {
  const decorators: MethodDecorator[] = [];
  const swagger = getSwaggerModule();

  if (swaggerDocs && swagger) decorators.push(...getSwaggerDefinitions(swagger));

  return (target: any, key: any, descriptor: PropertyDescriptor) => {
    decorators.forEach((decorator) => decorator(target, key, descriptor));
  };
};

function getSwaggerDefinitions(swagger: Swagger) {
  const { ApiOkResponse, ApiNotFoundResponse, ApiParam } = swagger;

  const param = ApiParam({ name: 'batch_id', format: 'uuid' });
  const NotFound = ApiNotFoundResponse({
    description: 'Batch not found',
    schema: getErrorSchema({ status: 404, message: 'No records found for <id>' }),
  });
  const Ok = ApiOkResponse({ description: 'Current batch status', schema: getBatchSchema() });

  return [param, NotFound, Ok];
}
