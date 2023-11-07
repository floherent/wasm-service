import { IsString, IsOptional, ValidateIf, ArrayMaxSize } from 'class-validator';

import { IsJsonValue, MaxBatchSize, JsonValue, MAX_BATCH_LENGTH } from '@shared/utils';

export class ExecuteWasmDto {
  @ArrayMaxSize(MAX_BATCH_LENGTH, { message: 'must be less than or equal to $constraint1 items' })
  @MaxBatchSize()
  @ValidateIf((obj) => obj.kind === 'batch')
  @IsJsonValue()
  inputs: JsonValue | JsonValue[];

  @IsString()
  @IsOptional()
  kind: 'single' | 'batch' = 'single';

  @IsString()
  @IsOptional()
  format: 'columnar' | 'json' = 'json';
}
