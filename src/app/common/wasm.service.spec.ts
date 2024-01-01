import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';

import { AppConfig, DEFAULT_CONFIG } from '@app/modules/config';
import { WasmService } from './wasm.service';

describe('WasmService', () => {
  let service: WasmService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [WasmService, { provide: AppConfig, useValue: { props: DEFAULT_CONFIG } }],
    }).compile();

    service = module.get<WasmService>(WasmService);
  });

  it('should be defined', () => expect(service).toBeDefined());
});
