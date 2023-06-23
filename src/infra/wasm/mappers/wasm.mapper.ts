import { Injectable } from '@nestjs/common';

import { WasmFileDto } from '@domain/wasm';
import { EntityModelMapper } from '@shared/mappers';

import { WasmModelHandler, WasmModel } from '../models/wasm.model';

@Injectable()
export class WasmMapper extends EntityModelMapper<WasmFileDto, WasmModelHandler> {
  toModel(from: WasmFileDto): WasmModelHandler {
    return new WasmModelHandler({
      version_id: from.versionId,
      file_name: from.fileName,
      file_path: from.file_path,
      original_name: from.originalName,
      size: from.size,
      uploaded_at: from.uploadedAt,
      service_name: from.serviceName,
      revision: from.revision,
      username: from.username,
    });
  }

  toEntity(from: WasmModel): WasmFileDto {
    return new WasmFileDto(
      from.version_id,
      from.file_name,
      from.file_path,
      from.original_name,
      from.size,
      from.uploaded_at,
      from.service_name,
      from.revision,
      from.username,
    );
  }
}
