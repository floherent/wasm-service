import { Injectable } from '@nestjs/common';

import { WasmFile } from '@domain/wasm';
import { EntityModelMapper } from '@shared/mappers';

import { WasmModel } from '../models/wasm.model';

@Injectable()
export class WasmMapper extends EntityModelMapper<WasmFile, WasmModel> {
  toModel(from: WasmFile): WasmModel {
    return new WasmModel({
      version_id: from.id,
      file_name: from.fileName,
      path: from.path,
      original_name: from.originalName,
      size: from.size,
      uploaded_at: from.uploadedAt,
      service_name: from.serviceName,
      revision: from.revision,
      username: from.username,
    });
  }

  toEntity(from: WasmModel): WasmFile {
    return new WasmFile(
      from.version_id,
      from.file_name,
      from.path,
      from.original_name,
      from.size,
      from.uploaded_at,
      from.service_name,
      from.revision,
      from.username,
    );
  }
}
