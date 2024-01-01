import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { IWasmRepo } from '@domain/wasm';

export class DeleteWasmCommand {
  constructor(readonly versionId: string) {}
}

@CommandHandler(DeleteWasmCommand)
export class DeleteWasmCommandHandler implements ICommandHandler<DeleteWasmCommand, Result<Error, void>> {
  constructor(@Inject('IWasmRepo') private readonly repo: IWasmRepo) {}

  async execute(cmd: DeleteWasmCommand): Promise<Result<Error, void>> {
    return Result.safe(async () => await this.repo.deleteWasm(cmd.versionId));
  }
}
