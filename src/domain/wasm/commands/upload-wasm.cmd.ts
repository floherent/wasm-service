import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { WasmFileDto, UploadWasmDto, IWasmRepo } from '@domain/wasm';
import { WasmModel } from '@infra/wasm';
import { WasmService } from '@app/modules';

export class UploadWasmCommand {
  constructor(readonly dto: UploadWasmDto, readonly file: Express.Multer.File) {}
}

@CommandHandler(UploadWasmCommand)
export class UploadWasmCommandHandler implements ICommandHandler<UploadWasmCommand, Result<Error, WasmModel>> {
  constructor(@Inject('IWasmRepo') private readonly repo: IWasmRepo, private wasmService: WasmService) {}

  async execute(cmd: UploadWasmCommand): Promise<Result<Error, WasmModel>> {
    return Result.safe(async () => {
      const { dto, file } = cmd;
      const wasm = new WasmFileDto(
        dto.versionId,
        file.filename,
        file.path,
        file.originalname,
        file.size,
        Date.now(),
        dto.serviceName,
        dto.revision,
        dto.username,
      );
      this.wasmService.setWasm(dto.versionId, file.path);
      return await this.repo.save(wasm);
    });
  }
}
