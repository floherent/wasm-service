import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

export class AddWasmByUriDto {
  /**
   * Where to download the wasm file from.
   *
   * 1) If the file is coming from Coherent SaaS, the URL should match the SDK Uri format:
   * - {folder-name}/{service-name}[{optional-version}] => e.g., "my-folder/pet-rater[1.0.0]"
   * - service/{service-id} => e.g., "service/some-service-uuid"
   * - version/{version-id} => e.g., "version/some-version-uuid"
   * - or a valid Entity Store URL (e.g., https://excel.uat.us.coherent.global/api/filemanager/DownloadDocument/{uuid}/{filename}.zip)
   *   and must be authenticated with bearer token or oauth2 credentials.
   *
   * Note that the SaaS platform requires authentication to work, so `connectivity` config must
   * be set up in the service's config file accordingly.
   *
   * 2) If the URL is pointing to a 3rd party server or microservice, either should be accessible
   * without any form of authentication.
   */
  @IsString()
  @IsNotEmpty()
  url: string;

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
