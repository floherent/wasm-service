import { IsString, IsOptional } from 'class-validator';

import { IsJsonValue, JsonValue } from '@shared/utils';

export class ExecuteWasmDto {
  @IsJsonValue()
  inputs: JsonValue | JsonValue[];

  @IsString()
  @IsOptional()
  kind: 'single' | 'batch' = 'single';
}
