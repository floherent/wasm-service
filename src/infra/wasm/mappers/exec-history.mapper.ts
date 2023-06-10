import { ExecHistory } from '@domain/wasm';
import { Injectable } from '@nestjs/common';

import { AbstractMapper } from '@shared/mappers';
import { ExecHistoryModel } from '../models/exec-history.model';

@Injectable()
export class ExecHistoryMapper extends AbstractMapper<ExecHistory, ExecHistoryModel> {
  map(from: ExecHistory): ExecHistoryModel {
    return new ExecHistoryModel(
      from.version_id,
      JSON.stringify(from.inputs),
      JSON.stringify(from.outputs),
      from.executed_at.toString(),
      from.execution_time,
    );
  }

  reverse(from: ExecHistoryModel): ExecHistory {
    return new ExecHistory(
      from.version_id,
      JSON.parse(from.inputs),
      JSON.parse(from.outputs),
      new Date(Number(from.executed_at)),
      from.execution_time,
    );
  }
}
