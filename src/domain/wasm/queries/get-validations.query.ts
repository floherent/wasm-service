import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { IWasmRepo, ExecData, WasmValidations, WasmValidationDto } from '@domain/wasm';

export class GetValidationsQuery {
  constructor(readonly versionId: string, readonly dto: WasmValidationDto) {}
}

@QueryHandler(GetValidationsQuery)
export class GetValidationsQueryHandler
  implements IQueryHandler<GetValidationsQuery, Result<Error, ExecData | WasmValidations>>
{
  constructor(@Inject('IWasmRepo') private readonly repo: IWasmRepo) {}

  async execute(query: GetValidationsQuery): Promise<Result<Error, ExecData | WasmValidations>> {
    return Result.safe(async () => await this.repo.getValidations(query.versionId, query.dto));
  }
}
