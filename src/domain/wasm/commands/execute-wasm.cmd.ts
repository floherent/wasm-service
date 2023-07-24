import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { ExecuteWasmDto, IWasmRepo } from '@domain/wasm';
import { ExecResponseData } from '@shared/utils';

export class ExecuteWasmCommand {
  constructor(readonly versionId: string, readonly dto: ExecuteWasmDto) {}
}

@CommandHandler(ExecuteWasmCommand)
export class ExecuteWasmCommandHandler implements ICommandHandler<ExecuteWasmCommand, Result<Error, ExecResponseData>> {
  constructor(@Inject('IWasmRepo') private readonly repo: IWasmRepo) {}

  async execute(cmd: ExecuteWasmCommand): Promise<Result<Error, ExecResponseData>> {
    const { versionId, dto } = cmd;

    return Result.safe(async () => {
      return dto.kind === 'batch'
        ? await this.repo.executeMany(versionId, dto)
        : await this.repo.executeOne(versionId, dto);
    });
  }
}
