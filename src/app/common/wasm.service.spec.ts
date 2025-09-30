import { Test, TestingModule } from '@nestjs/testing';

import { AppConfig, DEFAULT_CONFIG } from '@app/modules/config';
import { WasmService } from './wasm.service';
import { SaasService } from './saas.service';

describe('WasmService', () => {
  it('should be defined with no wasm in cache', async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WasmService,
        SaasService,
        { provide: AppConfig, useValue: { props: { ...DEFAULT_CONFIG, connectivity: { enabled: false } } } },
      ],
    }).compile();

    const wasmService = module.get<WasmService>(WasmService);
    expect(wasmService).toBeDefined();
    expect(wasmService.getWasm('some-version-id')).toBeUndefined(); // no wasm in cache yet
  });
});
