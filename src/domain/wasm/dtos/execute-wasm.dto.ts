import { IsString, IsOptional, IsObject } from 'class-validator';

import { IsJsonValue, JsonValue } from '@shared/utils';

export class ExecuteWasmDto {
  @IsJsonValue()
  inputs: JsonValue | JsonValue[];

  @IsObject({ message: 'must be a valid object' })
  @IsOptional()
  shared: JsonValue;

  @IsOptional()
  @IsObject({ message: 'must be a valid object' })
  metadata: Record<string, any>;

  @IsString()
  @IsOptional()
  kind: 'single' | 'batch';

  format: 'columnar' | 'json';
}
