import { Test, TestingModule } from '@nestjs/testing';

import { ConfigController, AppConfig, DEFAULT_CONFIG } from '@app/modules/config';

describe('ConfigController', () => {
  let configController: ConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ConfigController],
      providers: [{ provide: AppConfig, useValue: { props: DEFAULT_CONFIG } }],
    }).compile();

    configController = module.get<ConfigController>(ConfigController);
  });

  it('findOne (/v1/config)', () => {
    const result = configController.findOne();
    const { app, spark, health } = result;

    expect(app.name).toBe('wasm-service');
    expect(app.description).toBe('API service for running WASM files');
    expect(app.port).toBe(8080);
    expect(app.context_path).toBe('/');
    expect(app.upload_path).toBe('uploads');
    expect(app.body_limit).toBe('50mb');

    expect(spark.cache_size).toBe(8);
    expect(spark.threads).toBe(1);
    expect(spark.replicas).toBe(1);

    expect(health.disk).toBe(0.75);
    expect(health.wasm).toBe(512);
    expect(health.memory).toBe(1024);
  });
});
