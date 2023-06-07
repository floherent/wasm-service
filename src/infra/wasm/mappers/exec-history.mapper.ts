import { Injectable } from '@nestjs/common';

import { ExecHistory } from '@domain/wasm';
import { EntityModelMapper } from '@shared/mappers';

import { ExecHistoryModel } from '../models/exec-history.model';

@Injectable()
export class ExecHistoryMapper extends EntityModelMapper<ExecHistory, ExecHistoryModel> {
  toModel(from: ExecHistory): ExecHistoryModel {
    return new ExecHistoryModel({
      version_id: from.versionId,
      inputs: from.inputs,
      outputs: from.outputs,
      executed_at: from.executedAt,
      execution_time: from.executionTime,
      service_name: from.serviceName,
      revision: from.revision,
    });
  }

  toEntity(from: ExecHistoryModel): ExecHistory {
    return new ExecHistory(
      from.version_id,
      from.inputs,
      from.outputs,
      from.executed_at,
      from.execution_time,
      from.service_name,
      from.revision,
    );
  }
}
