import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class AddWasmByUriDto {
  @ApiProperty({ name: 'url', description: 'url of the wasm bundle', format: 'url' })
  @IsString()
  @IsNotEmpty()
  url: string;

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
}
