import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { ExecuteWasmDto, IWasmRepo } from '@domain/wasm';
import { IBatchRepo } from '@domain/batch';
import { ExecResponseData, Spark } from '@shared/utils';

export class ExecuteWasmCommand {
  constructor(readonly versionId: string, readonly dto: ExecuteWasmDto) {}
}

@CommandHandler(ExecuteWasmCommand)
export class ExecuteWasmCommandHandler implements ICommandHandler<ExecuteWasmCommand, Result<Error, ExecResponseData>> {
  constructor(
    @Inject('IWasmRepo') private readonly wasmRepo: IWasmRepo,
    @Inject('IBatchRepo') private readonly batchRepo: IBatchRepo,
  ) {}

  async execute(cmd: ExecuteWasmCommand): Promise<Result<Error, ExecResponseData>> {
    const { versionId, dto } = cmd;

    return Result.safe(async () => {
      const [format, inputs] = Spark.inferFormatFrom(dto.inputs);
      dto.format = format;
      dto.inputs = inputs;
      return dto.kind === 'batch'
        ? await this.batchRepo.executeSync(versionId, dto)
        : await this.wasmRepo.execute(versionId, dto);
    });
  }
}
