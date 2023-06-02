import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

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
}
