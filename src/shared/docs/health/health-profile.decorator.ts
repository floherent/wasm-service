import { EndpointOptions, getSwaggerModule, type Swagger } from '../utils';

/**
 * Documents the "Health profile" endpoint using Swagger.
 */
export const HealthProfile = ({ swaggerDocs }: EndpointOptions = { swaggerDocs: true }) => {
  const decorators: MethodDecorator[] = [];
  const swagger = getSwaggerModule();

  if (swaggerDocs && swagger) decorators.push(...getSwaggerDefinitions(swagger));

  return (target: any, key: any, descriptor: PropertyDescriptor) => {
    decorators.forEach((decorator) => decorator(target, key, descriptor));
  };
};

function getSwaggerDefinitions(swagger: Swagger) {
  const { ApiOkResponse } = swagger;

  const Ok = ApiOkResponse({
    description: 'Get health profile',
    schema: {
      type: 'object',
      properties: {
        rss: {
          type: 'number',
          description: 'resident set size',
          example: 73,
        },
        heap_total: {
          type: 'number',
          description: 'total size of the allocated heap',
          example: 32,
        },
        heap_used: {
          type: 'number',
          description: 'heap actually used',
          example: 28,
        },
        threshold: {
          type: 'object',
          properties: {
            disk: {
              type: 'number',
              description: 'disk threshold percent',
              example: 0.75,
            },
            wasm: {
              type: 'number',
              description: 'wasm threshold',
              example: 512,
            },
            memory: {
              type: 'number',
              description: 'memory threshold',
              example: 1024,
            },
          },
        },
      },
    },
  });

  return [Ok];
}
