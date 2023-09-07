import { Injectable } from '@nestjs/common';

import { Batch } from '@domain/wasm';
import { EntityModelMapper } from '@shared/mappers';
import { BatchStatus } from '@shared/utils';
import { BatchModelHandler, BatchModel } from '../models/batch.model';

@Injectable()
export class BatchMapper extends EntityModelMapper<Batch, BatchModelHandler> {
  toModel(from: Batch): BatchModelHandler {
    return new BatchModelHandler({
      id: from.id,
      status: from.status,
      service_id: from.service_id,
      executed_at: from.executed_at.toString(),
      total_inputs: from.total_inputs.toString(),
      total_processed: from.total_processed.toString(),
      total_outputs: from.total_outputs.toString(),
      duration_in_ms: from.duration_in_ms?.toString(),
    });
  }

  toEntity(from: BatchModel): Batch {
    return new Batch(
      from.id,
      from.status as BatchStatus,
      from.service_id,
      undefined,
      new Date(Number(from.executed_at)),
      Number(from.total_inputs),
      Number(from.total_processed),
      Number(from.total_outputs),
      Number(from.duration_in_ms),
    );
  }
}
