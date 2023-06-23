import { Logger, UploadedFile, UseInterceptors, ParseFilePipeBuilder, UseFilters, HttpStatus } from '@nestjs/common';
import { Controller, Get, Post, Put, Delete, Body, Param, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { Response } from 'express';
import { Result } from 'typescript-result';

import { UploadWasmDto, ExecuteWasmDto, ExecHistory, DownloadWasmQuery, DownloadHistoryQuery } from '@domain/wasm';
import { UploadWasmCommand, ExecuteWasmCommand, GetHistoryQuery, DeleteWasmCommand } from '@domain/wasm';
import { ExecResponseData, Paginated, PaginationParams, PaginationQueryParams } from '@shared/utils';
import { dumpOntoDisk } from '@shared/utils';
import { WasmModel } from '@infra/wasm';
import { ApiExceptionFilter } from '@shared/errors';

@UseFilters(new ApiExceptionFilter())
@Controller({ path: 'services', version: '1' })
export class ServicesController {
  private readonly logger = new Logger(ServicesController.name);

  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Put(':version_id')
  @UseInterceptors(FileInterceptor('wasm', { storage: dumpOntoDisk() }))
  async uploadWasmFile(
    @Res() response: Response,
    @Param('version_id') versionId: string,
    @Body() body: { data?: string },
    @UploadedFile(new ParseFilePipeBuilder().addFileTypeValidator({ fileType: 'zip' }).build())
    file: Express.Multer.File,
  ) {
    const data = await UploadWasmDto.validate(versionId, body?.data);
    const command = new UploadWasmCommand(data, file);
    const result = await this.commandBus.execute<UploadWasmCommand, Result<Error, WasmModel>>(command);
    const payload = result.getOrThrow();

    this.logger.log(`wasm file (${payload.version_id}) has been uploaded.`);
    response.status(HttpStatus.CREATED).send(payload);
  }

  @Get(':version_id')
  async downloadWasmFile(@Res() response: Response, @Param('version_id') versionId: string) {
    const query = new DownloadWasmQuery(versionId);
    const result = await this.queryBus.execute<DownloadWasmQuery, Result<Error, Buffer>>(query);
    const file = result.getOrThrow();

    this.logger.log(`wasm file (${versionId}) has been downloaded.`);
    response.contentType('application/zip').status(HttpStatus.OK).send(file);
  }

  @Post(':version_id/execute')
  async executeWasm(@Res() response: Response, @Param('version_id') versionId: string, @Body() body: ExecuteWasmDto) {
    const command = new ExecuteWasmCommand(versionId, body);
    const result = await this.commandBus.execute<ExecuteWasmCommand, Result<Error, ExecResponseData>>(command);
    const payload = result.getOrThrow();

    response.status(HttpStatus.OK).send(payload);
  }

  @Get(':version_id/history')
  async getWasmExecHistory(
    @Res() response: Response,
    @Param('version_id') versionId: string,
    @PaginationParams() pagination: PaginationQueryParams,
  ) {
    const query = new GetHistoryQuery(versionId, pagination);
    const result = await this.queryBus.execute<GetHistoryQuery, Result<Error, Paginated<ExecHistory>>>(query);
    const payload = result.getOrThrow();

    this.logger.log(`execution fetched for wasm file (${versionId}): ${payload.pagination.total_items} items`);
    response.status(HttpStatus.OK).send(payload);
  }

  @Get(':version_id/history/file')
  async downloadHistoryFile(@Res() response: Response, @Param('version_id') versionId: string) {
    const query = new DownloadHistoryQuery(versionId);
    const result = await this.queryBus.execute<DownloadHistoryQuery, Result<Error, Buffer>>(query);
    const file = result.getOrThrow();

    this.logger.log(`execution history file (${versionId}) has been downloaded.`);
    response.contentType('text/csv').status(HttpStatus.OK).send(file);
  }

  @Delete(':version_id')
  async deleteWasmFile(@Res() response: Response, @Param('version_id') versionId: string) {
    await this.commandBus.execute<DeleteWasmCommand, Result<Error, void>>(new DeleteWasmCommand(versionId));
    this.logger.log(`wasm file (${versionId}) has been deleted.`);
    response.status(HttpStatus.NO_CONTENT).send();
  }
}
