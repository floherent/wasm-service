import { ExecHistory } from '@domain/wasm';
import { Injectable } from '@nestjs/common';

import { AbstractMapper } from '@shared/mappers';
import { ExecHistoryModel } from '../models/exec-history.model';

@Injectable()
export class ExecHistoryMapper extends AbstractMapper<ExecHistory, ExecHistoryModel> {
  map(from: ExecHistory): ExecHistoryModel {
    return new ExecHistoryModel(
      JSON.stringify(from.inputs),
      JSON.stringify(from.outputs),
      from.executed_at.toString(),
      from.duration.toString(),
    );
  }

  reverse(from: ExecHistoryModel): ExecHistory {
    return new ExecHistory(
      JSON.parse(from.inputs),
      JSON.parse(from.outputs),
      new Date(Number(from.executed_at)),
      +from.duration,
    );
  }
}
