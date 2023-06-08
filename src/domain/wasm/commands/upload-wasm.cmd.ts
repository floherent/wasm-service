import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { WasmService } from '@app/modules/services/wasm.service';
import { WasmFileDto, UploadWasmDto, IWasmRepo } from '@domain/wasm';
import { WasmModel } from '@infra/wasm';

export class UploadWasmCommand {
  constructor(readonly dto: UploadWasmDto, readonly file: Express.Multer.File) {}
}

@CommandHandler(UploadWasmCommand)
export class UploadWasmCommandHandler implements ICommandHandler<UploadWasmCommand, Result<Error, WasmModel>> {
  constructor(@Inject('IWasmRepo') private readonly repo: IWasmRepo, private readonly wasmService: WasmService) {}

  async execute(cmd: UploadWasmCommand): Promise<Result<Error, WasmModel>> {
    return Result.safe(async () => {
      const { dto, file } = cmd;
      // this.wasmService.setWasm(dto.versionId, Buffer.from(file.buffer));
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
      return await this.repo.save(wasm);
    });
  }
}
