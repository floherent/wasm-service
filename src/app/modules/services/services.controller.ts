import { Logger, UploadedFile, UseInterceptors, ParseFilePipeBuilder, HttpException, HttpStatus } from '@nestjs/common';
import { Controller, Put, Body } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus } from '@nestjs/cqrs';
import { Result } from 'typescript-result';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validateOrReject } from 'class-validator';

import { UploadWasmCommand, UploadWasmDto, WasmFile } from '@domain/wasm';
import { dumpOntoDisk } from '@shared/utils';

@Controller({ path: 'services', version: '1' })
export class ServicesController {
  constructor(private readonly commandBus: CommandBus) {}

  @Put('upload')
  @UseInterceptors(FileInterceptor('wasm', { storage: dumpOntoDisk() }))
  async uploadFile(
    @Body() body: { data?: string },
    @UploadedFile(new ParseFilePipeBuilder().addFileTypeValidator({ fileType: 'zip' }).build())
    file: Express.Multer.File,
  ): Promise<WasmFile> {
    try {
      const data = plainToInstance(UploadWasmDto, JSON.parse(body?.data));
      await validateOrReject(data);

      const result = await this.commandBus.execute<UploadWasmCommand, Result<Error, WasmFile>>(
        new UploadWasmCommand(data, file),
      );

      const payload = result.getOrThrow();
      Logger.log(`wasm saved with version id: ${payload.id}`);
      return payload;
    } catch (cause) {
      // FIXME: this is a temporary solution to handle errors.
      Logger.error(cause);
      if (cause instanceof HttpException) throw cause;
      if (cause instanceof Array<ValidationError>) throw new HttpException({ error: cause }, HttpStatus.BAD_REQUEST);
      throw new HttpException({ error: cause?.message ?? cause }, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}
