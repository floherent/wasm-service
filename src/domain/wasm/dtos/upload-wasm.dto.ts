import { Expose, plainToInstance } from 'class-transformer';
import { IsString, IsOptional, IsNotEmpty, validateOrReject } from 'class-validator';

import { BadUploadWasmData } from '@shared/errors';

export class UploadWasmDto {
  @Expose({ name: 'version_id' })
  @IsString()
  @IsNotEmpty()
  versionId: string;

  @Expose({ name: 'service_name' })
  @IsString()
  @IsOptional()
  serviceName?: string;

  @IsString()
  @IsOptional()
  revision?: string;

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
