import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, VersioningType } from '@nestjs/common';
import * as request from 'supertest';
import { resolve, join } from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';

import { AppModule } from '@app/modules/app.module';
import { ApiExceptionFilter, ApiValidationPipe } from '@shared/errors';

const WASM_FILE = resolve(__dirname, '..', 'examples', 'volume-cylinder.zip');
const VERSION_ID = 'test-volume-cylinder';
const UPLOAD_DIR = resolve(__dirname, '..', 'uploads');

describe('ServicesController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    if (!existsSync(UPLOAD_DIR)) mkdirSync(UPLOAD_DIR, { recursive: true });

    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    app.enableVersioning({ type: VersioningType.URI });
    app.useGlobalPipes(ApiValidationPipe);
    app.useGlobalFilters(new ApiExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    const wasmZip = join(UPLOAD_DIR, `${VERSION_ID}.zip`);
    const historyCsv = join(UPLOAD_DIR, `${VERSION_ID}.csv`);
    if (existsSync(wasmZip)) rmSync(wasmZip);
    if (existsSync(historyCsv)) rmSync(historyCsv);
    await app.close();
  });

  describe('PUT /v1/services/:version_id (upload)', () => {
    it('should upload a wasm zip file', () => {
      return request(app.getHttpServer())
        .put(`/v1/services/${VERSION_ID}`)
        .attach('wasm', WASM_FILE)
        .expect(201)
        .expect((res) => {
          expect(res.body).toMatchObject({
            version_id: VERSION_ID,
            file_name: `${VERSION_ID}.zip`,
            original_name: 'volume-cylinder.zip',
          });
          expect(res.body.size).toBeGreaterThan(0);
          expect(res.body.uploaded_at).toBeDefined();
        });
    });

    it('should reject upload without a file', () => {
      return request(app.getHttpServer())
        .put(`/v1/services/${VERSION_ID}`)
        .expect(400)
        .expect((res) => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.status).toBe(400);
          expect(res.body.error.message).toContain('wasm bundle is required');
        });
    });
  });

  describe('GET /v1/services (list)', () => {
    it('should list uploaded services with pagination', () => {
      return request(app.getHttpServer())
        .get('/v1/services')
        .expect(200)
        .expect((res) => {
          expect(res.body.content).toBeInstanceOf(Array);
          expect(res.body.pagination).toMatchObject({
            page: expect.any(Number),
            size: expect.any(Number),
            total_items: expect.any(Number),
            total_pages: expect.any(Number),
            number_of_items: expect.any(Number),
          });

          const service = res.body.content.find((s: any) => s.version_id === VERSION_ID);
          expect(service).toBeDefined();
          expect(service.file_name).toBe(`${VERSION_ID}.zip`);
        });
    });
  });

  describe('POST /v1/services/:version_id/execute', () => {
    it('should execute wasm with valid inputs', () => {
      return request(app.getHttpServer())
        .post(`/v1/services/${VERSION_ID}/execute`)
        .send({ inputs: { Height: 10, Radius: 5 } })
        .expect(200)
        .expect((res) => {
          expect(res.body.response_data).toBeDefined();
          expect(res.body.response_data.outputs).toBeDefined();
          expect(res.body.response_data.outputs.Volume).toBeCloseTo(785.398, 0);
          expect(res.body.response_meta).toBeDefined();
          expect(res.body.response_meta.version_id).toBe(VERSION_ID);
        });
    });

    it('should execute wasm with different inputs', () => {
      return request(app.getHttpServer())
        .post(`/v1/services/${VERSION_ID}/execute`)
        .send({ inputs: { Height: 20, Radius: 3 } })
        .expect(200)
        .expect((res) => {
          expect(res.body.response_data.outputs.Volume).toBeCloseTo(565.487, 0);
        });
    });

    it('should reject execution with invalid inputs (non-object)', () => {
      return request(app.getHttpServer())
        .post(`/v1/services/${VERSION_ID}/execute`)
        .send({ inputs: 'invalid' })
        .expect(400)
        .expect((res) => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.status).toBe(400);
        });
    });

    it('should return an error for a non-existent version_id', () => {
      return request(app.getHttpServer())
        .post('/v1/services/non-existent-id/execute')
        .send({ inputs: { Height: 10, Radius: 5 } })
        .expect((res) => {
          expect(res.status).toBeGreaterThanOrEqual(400);
          expect(res.body.error).toBeDefined();
        });
    });
  });

  describe('POST /v1/services/:version_id/validation', () => {
    it('should return validation data', () => {
      return request(app.getHttpServer())
        .post(`/v1/services/${VERSION_ID}/validation`)
        .send({ inputs: { Height: 10, Radius: 5 } })
        .expect(200)
        .expect((res) => {
          expect(res.body.response_data).toBeDefined();
        });
    });

    it('should also work via the /validate alias', () => {
      return request(app.getHttpServer()).post(`/v1/services/${VERSION_ID}/validate`).send({}).expect(200);
    });
  });

  describe('GET /v1/services/:version_id (download)', () => {
    it('should download the wasm zip file', () => {
      return request(app.getHttpServer())
        .get(`/v1/services/${VERSION_ID}`)
        .buffer(true)
        .parse((res, callback) => {
          const chunks: Buffer[] = [];
          res.on('data', (chunk: Buffer) => chunks.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(chunks)));
        })
        .expect(200)
        .expect('Content-Type', /application\/zip/)
        .expect((res) => {
          expect(Buffer.isBuffer(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });

    it('should return 404 for a non-existent version_id', () => {
      return request(app.getHttpServer())
        .get('/v1/services/does-not-exist')
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toBeDefined();
          expect(res.body.error.status).toBe(404);
        });
    });
  });

  describe('GET /v1/services/:version_id/history', () => {
    it('should return execution history as paginated JSON', () => {
      return request(app.getHttpServer())
        .get(`/v1/services/${VERSION_ID}/history`)
        .expect(200)
        .expect((res) => {
          expect(res.body.content).toBeInstanceOf(Array);
          expect(res.body.pagination).toBeDefined();
        });
    });

    it('should accept pagination params', () => {
      return request(app.getHttpServer())
        .get(`/v1/services/${VERSION_ID}/history?page=1&limit=10`)
        .expect(200)
        .expect((res) => {
          expect(res.body.pagination.page).toBe(1);
          expect(res.body.pagination.size).toBe(10);
        });
    });
  });

  describe('DELETE /v1/services/:version_id/history', () => {
    it('should delete or report no history', () => {
      return request(app.getHttpServer())
        .delete(`/v1/services/${VERSION_ID}/history`)
        .expect((res) => {
          // 204 if history file existed and was deleted, 404 if history was never recorded
          expect([204, 404]).toContain(res.status);
        });
    });

    it('should return empty history after deletion', () => {
      return request(app.getHttpServer())
        .get(`/v1/services/${VERSION_ID}/history`)
        .expect(200)
        .expect((res) => {
          expect(res.body.content).toEqual([]);
          expect(res.body.pagination.total_items).toBe(0);
        });
    });
  });

  describe('DELETE /v1/services/:version_id', () => {
    it('should delete the wasm service', () => {
      return request(app.getHttpServer()).delete(`/v1/services/${VERSION_ID}`).expect(204);
    });

    it('should no longer appear in the list', () => {
      return request(app.getHttpServer())
        .get('/v1/services')
        .expect(200)
        .expect((res) => {
          const found = res.body.content.find((s: any) => s.version_id === VERSION_ID);
          expect(found).toBeUndefined();
        });
    });

    it('should return 404 when downloading a deleted service', () => {
      return request(app.getHttpServer()).get(`/v1/services/${VERSION_ID}`).expect(404);
    });
  });
});
