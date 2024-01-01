import { ApiError } from '@shared/errors';

export type Swagger = typeof import('@nestjs/swagger');

export interface EndpointOptions {
  /**
   * Whether to document the endpoint with Swagger or not.
   *
   * @default true
   */
  swaggerDocs?: boolean;
}

/**
 * Attempts to load the `@nestjs/swagger` module.
 * @returns the `@nestjs/swagger` module if installed, `null` otherwise.
 */
export function getSwaggerModule(): Swagger | null {
  let swagger: Swagger | null = null;
  try {
    swagger = require('@nestjs/swagger');
  } catch {
    swagger = null;
  }
  return swagger;
}

export function getErrorSchema({ status, message, cause }: ApiError) {
  return {
    type: 'object',
    additionalProperties: false,
    properties: {
      error: {
        type: 'object',
        required: ['status', 'message'],
        additionalProperties: false,
        properties: {
          status: {
            type: 'number',
            description: 'HTTP status code',
            example: status,
          },
          message: {
            type: 'string',
            description: 'message describing the failure',
            example: message,
          },
          cause: {
            type: 'object',
            description: 'description of the failure if any',
            example: cause ?? null,
            oneOf: [
              { type: 'object' },
              {
                type: 'array',
                items: { type: 'string' },
              },
              { type: 'string' },
              { type: 'null' },
            ],
          },
        },
      },
    },
  };
}

export function getWasmDataSchema() {
  return {
    type: 'object',
    required: ['version_id', 'file_name', 'original_name', 'file_path', 'size', 'uploaded_at'],
    properties: {
      version_id: { type: 'string', format: 'uuid', example: 'f0b6d6a0-06b0-4a5a-9b3f-9c4a2c9b6a2e' },
      file_name: { type: 'string', description: 'WASM file name', example: 'f0b6d6a0-06b0-4a5a-9b3f-9c4a2c9b6a2e.zip' },
      original_name: { type: 'string', description: 'original WASM file name', example: 'wasm-bundle.zip' },
      file_path: {
        type: 'string',
        description: 'WASM file path',
        example: 'uploads/f0b6d6a0-06b0-4a5a-9b3f-9c4a2c9b6a2e.zip',
      },
      size: { type: 'number', description: 'WASM file size in bytes', example: 1024 },
      uploaded_at: {
        type: 'string',
        format: 'date-time',
        description: 'upload date',
        example: '2021-08-26T14:22:01.000Z',
      },
      service_name: { type: 'string', description: 'service name', example: 'Pet Rater' },
      revision: { type: 'string', description: 'revision number if any', example: '1.0.0' },
      username: { type: 'string', description: 'who uploaded the file', example: 'john.doe@example.com' },
    },
  };
}

export function getPaginationSchema() {
  return {
    type: 'object',
    required: ['page', 'size', 'total_items', 'total_pages', 'number_of_items'],
    properties: {
      page: { type: 'number', description: 'current page', example: 1 },
      size: { type: 'number', description: 'number of items per page', example: 100 },
      total_items: { type: 'number', description: 'total number of items', example: 1000 },
      total_pages: { type: 'number', description: 'total number of pages', example: 10 },
      number_of_items: { type: 'number', description: 'number of items in the current page', example: 100 },
    },
  };
}

export function getBatchSchema() {
  return {
    type: 'object',
    required: [
      'id',
      'status',
      'service_id',
      'client_id',
      'executed_at',
      'buffer_size',
      'total_inputs',
      'total_processed',
      'total_outputs',
      'duration_in_ms',
    ],
    properties: {
      id: { type: 'string', format: 'uuid', example: 'f0b6d6a0-06b0-4a5a-9b3f-9c4a2c9b6a2e' },
      status: { type: 'string', enum: ['created', 'processing', 'completed', 'failed'], example: 'created' },
      service_id: { type: 'string', format: 'uuid', example: 'efb6d6a0-06b0-4a5a-9b3f-9c4a2c9b6a2e' },
      client_id: { type: 'string', example: 'ws_YLoWvMX_l5m_cmOHAAAB' },
      executed_at: { type: 'string', format: 'date-time', example: '2021-08-26T14:22:01.000Z' },
      buffer_size: { type: 'number', example: 1024 },
      total_inputs: { type: 'number', example: 1000 },
      total_processed: { type: 'number', example: 0 },
      total_outputs: { type: 'number', example: 0 },
      duration_in_ms: { type: 'number', example: 1.23 },
    },
  };
}
