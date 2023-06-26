import { ApiProperty } from '@nestjs/swagger';
import { Expose, plainToInstance } from 'class-transformer';
import { IsString, IsOptional, IsNotEmpty, validateOrReject } from 'class-validator';

import { BadUploadWasmData } from '@shared/errors';

export class UploadWasmDto {
  @ApiProperty({ name: 'version_id', description: 'version id of the wasm bundle', format: 'uuid' })
  @Expose({ name: 'version_id' })
  @IsString()
  @IsNotEmpty()
  versionId: string;

  @ApiProperty({ required: false, name: 'service_name', description: 'name of the service' })
  @Expose({ name: 'service_name' })
  @IsString()
  @IsOptional()
  serviceName?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  revision?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  username?: string;

  static async validate(versionId: string, data?: string) {
    try {
      const dto = plainToInstance(UploadWasmDto, JSON.parse(data ?? '{}'));
      dto.versionId = versionId;
      await validateOrReject(dto);
      return dto;
    } catch (error) {
      throw new BadUploadWasmData('review validation errors', error);
    }
  }
}
