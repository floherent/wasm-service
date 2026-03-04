import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { IWasmRepo } from '@domain/wasm';

export class DeleteHistoryCommand {
  constructor(readonly versionId: string) {}
}

@CommandHandler(DeleteHistoryCommand)
export class DeleteHistoryCommandHandler implements ICommandHandler<DeleteHistoryCommand, Result<Error, void>> {
  constructor(@Inject('IWasmRepo') private readonly repo: IWasmRepo) {}

  async execute(cmd: DeleteHistoryCommand): Promise<Result<Error, void>> {
    return Result.safe(async () => await this.repo.deleteHistory(cmd.versionId));
  }
}
