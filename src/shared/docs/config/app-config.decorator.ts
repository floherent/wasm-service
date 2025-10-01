import { EndpointOptions, getSwaggerModule, type Swagger } from '../utils';

/**
 * Documents the "Get app config" endpoint using Swagger.
 */
export const GetAppConfig = ({ swaggerDocs }: EndpointOptions = { swaggerDocs: true }) => {
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
    description: 'Get app config',
    schema: {
      type: 'object',
      required: ['app', 'spark', 'health'],
      properties: {
        app: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'wasm-service' },
            description: { type: 'string', example: 'API service for running WASM files' },
            port: { type: 'number', example: 8080 },
            context_path: { type: 'string', example: '/' },
            upload_path: { type: 'string', example: 'uploads' },
            body_limit: { type: 'string', example: '50mb' },
          },
        },
        spark: {
          type: 'object',
          properties: {
            cache_size: { type: 'number', example: 4 },
            threads: {
              type: 'number',
              description: 'number of threads when using async batch processing',
              example: 4,
            },
            replicas: {
              type: 'number',
              description: 'number of replicas per worker',
              example: 1,
            },
          },
        },
        health: {
          type: 'object',
          properties: {
            disk: { type: 'number', example: 0.75 },
            wasm: { type: 'number', example: 512 },
            memory: { type: 'number', example: 1024 },
          },
        },
        connectivity: {
          type: 'object',
          required: ['enabled', 'base_url'],
          properties: {
            enabled: { type: 'boolean', example: true },
            base_url: { type: 'string', example: 'https://excel.uat.us.coherent.global/fieldengineering' },
            token: {
              type: 'object',
              properties: {
                header: { type: 'string', example: 'Authorization' },
                value: { type: 'string', example: '[secure]' },
              },
            },
            api_key: {
              type: 'object',
              properties: {
                header: { type: 'string', example: 'x-synthetic-key' },
                value: { type: 'string', example: '[secure]' },
              },
            },
            oauth2: {
              type: 'object',
              properties: {
                client_id: { type: 'string', example: '[secure]' },
                client_secret: { type: 'string', example: '[secure]' },
              },
            },
          },
        },
        history: {
          type: 'object',
          properties: {
            enabled: { type: 'boolean', example: true },
          },
        },
      },
    },
  });

  return [Ok];
}
