import { BatchExec } from '@domain/batch';
import { Injectable } from '@nestjs/common';

import { AbstractMapper } from '@shared/mappers';
import { BatchExecModel } from '../models/batch-exec.model';

@Injectable()
export class BatchExecMapper extends AbstractMapper<BatchExec, BatchExecModel> {
  map(from: BatchExec): BatchExecModel {
    return new BatchExecModel(
      JSON.stringify(from.inputs),
      JSON.stringify(from.outputs),
      from.executed_at.toString(),
      from.duration.toString(),
    );
  }

  reverse(from: BatchExecModel): BatchExec {
    return new BatchExec(
      JSON.parse(from.inputs),
      JSON.parse(from.outputs),
      new Date(Number(from.executed_at)),
      +from.duration,
    );
  }
}
