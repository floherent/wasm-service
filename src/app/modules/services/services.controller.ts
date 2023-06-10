import { Logger, UploadedFile, UseInterceptors, ParseFilePipeBuilder } from '@nestjs/common';
import { HttpException, HttpStatus, StreamableFile, Res } from '@nestjs/common';
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Response } from 'express';
import { Result } from 'typescript-result';
import { plainToInstance } from 'class-transformer';
import { ValidationError, validateOrReject } from 'class-validator';

import { UploadWasmDto, ExecuteWasmDto, ExecHistory, DownloadWasmQuery } from '@domain/wasm';
import { UploadWasmCommand, ExecuteWasmCommand, GetHistoryQuery, DeleteWasmCommand } from '@domain/wasm';
import { ExecResponseData, Paginated, PaginationParams, PaginationQueryParams } from '@shared/utils';
import { dumpOntoDisk } from '@shared/utils';
import { WasmModel } from '@infra/wasm';

@Controller({ path: 'services', version: '1' })
export class ServicesController {
  private readonly logger = new Logger(ServicesController.name);

  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Put(':version_id/upload')
  @UseInterceptors(FileInterceptor('wasm', { storage: dumpOntoDisk() }))
  async uploadWasmFile(
    @Param('version_id') versionId: string,
    @Body() body: { data?: string },
    @UploadedFile(new ParseFilePipeBuilder().addFileTypeValidator({ fileType: 'zip' }).build())
    file: Express.Multer.File,
  ): Promise<WasmModel> {
    return this.safe(async () => {
      const data = plainToInstance(UploadWasmDto, JSON.parse(body?.data));
      data.versionId = data.versionId ?? versionId;
      await validateOrReject(data);

      const result = await this.commandBus.execute<UploadWasmCommand, Result<Error, WasmModel>>(
        new UploadWasmCommand(data, file),
      );

      const payload = result.getOrThrow();
      this.logger.log(`wasm file (${payload.version_id}) has been uploaded.`);
      return payload;
    });
  }

  @Get(':version_id/download')
  downloadWasmFile(@Param('version_id') versionId: string, @Res() response: Response) {
    return this.safe(async () => {
      const result = await this.queryBus.execute<DownloadWasmQuery, Result<Error, StreamableFile>>(
        new DownloadWasmQuery(versionId),
      );

      const file = result.getOrThrow();
      response.contentType('application/zip');
      return response.send(file);
    });
  }

  @Post([':version_id/execute', ':version_id/exec', ':version_id/run'])
  async executeWasm(@Param('version_id') versionId: string, @Body() body: ExecuteWasmDto): Promise<ExecResponseData> {
    return this.safe(async () => {
      const result = await this.commandBus.execute<ExecuteWasmCommand, Result<Error, ExecResponseData>>(
        new ExecuteWasmCommand(versionId, body),
      );

      return result.getOrThrow();
    });
  }

  @Get(':version_id/history')
  async getWasmExecHistory(
    @Param('version_id') versionId: string,
    @PaginationParams() pagination: PaginationQueryParams,
  ): Promise<Paginated<ExecHistory>> {
    return this.safe(async () => {
      const result = await this.queryBus.execute<GetHistoryQuery, Result<Error, Paginated<ExecHistory>>>(
        new GetHistoryQuery(versionId, pagination),
      );

      return result.getOrThrow();
    });
  }

  @Delete(':version_id')
  deleteWasmFile(@Param('version_id') versionId: string): void {
    return this.safe(async () => {
      await this.commandBus.execute<DeleteWasmCommand, Result<Error, void>>(new DeleteWasmCommand(versionId));
    });
  }

  private safe(func: () => any | Promise<any>) {
    try {
      return func();
    } catch (cause) {
      // FIXME: this is a temporary solution to handle errors.
      this.logger.error(cause);
      if (cause instanceof HttpException) throw cause;
      if (cause instanceof Array<ValidationError>) throw new HttpException({ error: cause }, HttpStatus.BAD_REQUEST);
      throw new HttpException({ error: cause?.message ?? cause }, HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}
