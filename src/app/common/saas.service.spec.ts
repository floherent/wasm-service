import { Test, TestingModule } from '@nestjs/testing';

import { AppConfig, DEFAULT_CONFIG } from '@app/modules/config';
import { SaasService } from './saas.service';

describe('SaasService', () => {
  it('should be defined with no client', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [
        SaasService,
        { provide: AppConfig, useValue: { props: { ...DEFAULT_CONFIG, connectivity: { enabled: false } } } },
      ],
    }).compile();

    const saasService = module.get<SaasService>(SaasService);

    expect(saasService).toBeDefined();
    expect(saasService.client).toBeNull(); // no client yet because connectivity is disabled
  });

  it('should be defined with no client', async () => {
    const connectivity = Object.freeze({
      enabled: true,
      baseUrl: 'https://excel.uat.us.coherent.global/my-tenant',
      token: { value: 'Bearer 1234567890' },
    });
    const module: TestingModule = await Test.createTestingModule({
      imports: [],
      providers: [SaasService, { provide: AppConfig, useValue: { props: { ...DEFAULT_CONFIG, connectivity } } }],
    }).compile();

    const saasService = module.get<SaasService>(SaasService);

    expect(saasService).toBeDefined();
    expect(saasService.client).toBeDefined();
    expect(saasService.client.config.baseUrl.full).toBe(connectivity.baseUrl); // ready to call SaaS API
    expect(saasService.client.config.auth.type).toBe('token');
  });
});
