import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { IBatchRepo } from '@domain/batch';

export class DeleteBatchResultsCommand {
  constructor(readonly batchIds: string[]) {}
}

@CommandHandler(DeleteBatchResultsCommand)
export class DeleteBatchResultsCommandHandler
  implements ICommandHandler<DeleteBatchResultsCommand, Result<Error, number>>
{
  constructor(@Inject('IBatchRepo') private readonly repo: IBatchRepo) {}

  async execute(cmd: DeleteBatchResultsCommand): Promise<Result<Error, number>> {
    return Result.safe(async () => await this.repo.deleteResults(cmd.batchIds));
  }
}
