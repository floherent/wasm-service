import { Injectable } from '@nestjs/common';

import { WasmFile } from '@domain/wasm';
import { EntityModelMapper } from '@shared/mappers';

import { WasmModel } from '../models/wasm.model';

@Injectable()
export class WasmMapper extends EntityModelMapper<WasmFile, WasmModel> {
  toModel(from: WasmFile): WasmModel {
    return new WasmModel(
      from.id,
      from.fileName,
      from.path,
      from.originalName,
      from.size,
      from.uploadedAt,
      from.serviceName,
      from.revision,
      from.username,
    );
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
