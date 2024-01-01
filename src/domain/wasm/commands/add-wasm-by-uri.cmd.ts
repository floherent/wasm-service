import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';
import { v4 as uuid } from 'uuid';

import { WasmService } from '@app/common/wasm.service';
import { WasmFileDto, AddWasmByUriDto, IWasmRepo } from '@domain/wasm';
import { WasmModel } from '@infra/wasm';

export class AddWasmByUriCommand {
  constructor(readonly dto: AddWasmByUriDto, readonly versionId?: string, readonly preload = true) {}
}

@CommandHandler(AddWasmByUriCommand)
export class AddWasmByUriCommandHandler implements ICommandHandler<AddWasmByUriCommand, Result<Error, WasmModel>> {
  constructor(@Inject('IWasmRepo') private readonly repo: IWasmRepo, private wasmService: WasmService) {}

  async execute(cmd: AddWasmByUriCommand): Promise<Result<Error, WasmModel>> {
    return Result.safe(async () => {
      const { dto, preload } = cmd;
      const versionId = cmd.versionId || uuid();
      const file = await this.wasmService.download(cmd.dto.url, versionId);

      const wasm = new WasmFileDto(
        versionId,
        file.filename,
        file.path,
        file.url,
        file.size,
        Date.now(),
        dto.serviceName,
        dto.revision,
        dto.username,
      );
      if (preload) await this.wasmService.setWasm(versionId, file.path);
      return await this.repo.saveWasm(wasm);
    });
  }
}
