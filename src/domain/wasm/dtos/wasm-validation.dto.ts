import { IsOptional, IsObject } from 'class-validator';

import { JsonValue } from '@shared/utils';

export class WasmValidationDto {
  @IsObject({ message: 'must be a valid object' })
  @IsOptional()
  inputs: JsonValue;

  @IsOptional()
  @IsObject({ message: 'must be a valid object' })
  metadata: Record<string, any>;
}
