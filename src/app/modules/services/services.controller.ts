import { Logger, UploadedFile, UseInterceptors, ParseFilePipeBuilder } from '@nestjs/common';
import { Controller, Put, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus } from '@nestjs/cqrs';
import { Result } from 'typescript-result';

import { UploadWasmCommand, UploadWasmDto, WasmFile } from '@domain/wasm';

@Controller({ path: 'services', version: '1' })
export class ServicesController {
  constructor(private readonly commandBus: CommandBus) {}

  @Put('upload')
  @UseInterceptors(FileInterceptor('wasm'))
  async uploadFile(
    @Body() body: { data: string },
    @UploadedFile(new ParseFilePipeBuilder().addFileTypeValidator({ fileType: 'zip' }).build())
    file: Express.Multer.File,
  ): Promise<WasmFile> {
    const result = await this.commandBus.execute<UploadWasmCommand, Result<Error, WasmFile>>(
      new UploadWasmCommand(JSON.parse(body.data) as UploadWasmDto, file),
    );

    const payload = result.getOrThrow();
    Logger.log(`data saved with version id: ${payload.id}`);
    return payload;
  }
}
