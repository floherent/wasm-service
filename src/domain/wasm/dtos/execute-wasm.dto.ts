import { IsObject } from 'class-validator';

import { JsonValue } from '@shared/utils';

export class ExecuteWasmDto {
  @IsObject()
  inputs: JsonValue;
}
