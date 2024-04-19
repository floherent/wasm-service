import { IsOptional, IsObject, IsArray, ArrayNotEmpty } from 'class-validator';

import { JsonValue } from '@shared/utils';

export class ExecuteBatchDto {
  @IsArray({ message: 'must be an array' })
  @ArrayNotEmpty({ message: 'must not be empty' })
  inputs: JsonValue[];

  @IsObject({ message: 'must be a valid object' })
  @IsOptional()
  shared: JsonValue;

  @IsOptional()
  @IsObject({ message: 'must be a valid object' })
  metadata: Record<string, any>;

  format: 'columnar' | 'json';
}
