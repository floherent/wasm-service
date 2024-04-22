import { Logger, UploadedFile, UseInterceptors, ParseFilePipeBuilder, HttpStatus } from '@nestjs/common';
import { Controller, Get, Post, Put, Patch, Delete, Body, Query, Param, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { Result } from 'typescript-result';
import { Response } from 'express';

import { UploadWasmDto, AddWasmByUriDto, ExecuteWasmDto, ExecHistory, WasmData, WasmValidations } from '@domain/wasm';
import { UploadWasmCommand, ExecuteWasmCommand, DeleteWasmCommand, AddWasmByUriCommand } from '@domain/wasm';
import { GetHistoryQuery, DownloadWasmQuery, DownloadHistoryQuery, GetWasmDataQuery } from '@domain/wasm';
import { GetValidationsQuery } from '@domain/wasm';
import { ExecResponseData, Paginated, PaginationParams, PaginationQueryParams } from '@shared/utils';
import { UploadWasmFile, AddWasmFileByUri, DownloadWasmFile, DeleteWasmFile } from '@shared/docs';
import { FindWasmData, ExecuteWasm, GetWasmExecHistory, GetWasmValidations } from '@shared/docs';
import { dumpOntoDisk, QueryType } from '@shared/utils';

@ApiTags('services')
@Controller({ path: 'services', version: '1' })
export class ServicesController {
  private readonly logger = new Logger(ServicesController.name);

  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Get()
  @FindWasmData()
  async findAll(@Res() response: Response, @PaginationParams() pagination: PaginationQueryParams) {
    const query = new GetWasmDataQuery(pagination);
    const result = await this.queryBus.execute<GetWasmDataQuery, Result<Error, Paginated<WasmData>>>(query);
    const payload = result.getOrThrow();

    response.status(HttpStatus.OK).send(payload);
  }

  @Put(['', ':version_id'])
  @UseInterceptors(FileInterceptor('wasm', { storage: dumpOntoDisk() }))
  @UploadWasmFile()
  async uploadWasmFile(
    @Res() response: Response,
    @Param('version_id') id: string | undefined,
    @Query('preload') preload: boolean,
    @Body() body: { data?: string },
    @UploadedFile(new ParseFilePipeBuilder().addFileTypeValidator({ fileType: 'zip' }).build())
    file: Express.Multer.File,
  ) {
    const versionId = id || file.filename.replace('.zip', '');
    const data = await UploadWasmDto.validate(versionId, body?.data);
    const command = new UploadWasmCommand(data, file, !!preload);
    const result = await this.commandBus.execute<UploadWasmCommand, Result<Error, WasmData>>(command);
    const payload = result.getOrThrow();

    this.logger.log(`wasm file <${payload.version_id}> has been uploaded.`);
    response.status(HttpStatus.CREATED).send(payload);
  }

  @Patch(['', ':version_id'])
  @AddWasmFileByUri()
  async addWasmFileByUri(
    @Res() response: Response,
    @Param('version_id') versionId: string | undefined,
    @Query('preload') preload: boolean,
    @Body() body: AddWasmByUriDto,
  ) {
    const command = new AddWasmByUriCommand(body, versionId, !!preload);
    const result = await this.commandBus.execute<AddWasmByUriCommand, Result<Error, WasmData>>(command);
    const payload = result.getOrThrow();

    this.logger.log(`wasm file <${payload.version_id}> has been uploaded`);
    response.status(HttpStatus.CREATED).send(payload);
  }

  @Get(':version_id')
  @DownloadWasmFile()
  async downloadWasmFile(@Res() response: Response, @Param('version_id') versionId: string) {
    const query = new DownloadWasmQuery(versionId);
    const result = await this.queryBus.execute<DownloadWasmQuery, Result<Error, Buffer>>(query);
    const file = result.getOrThrow();

    this.logger.log(`wasm file <${versionId}> has been downloaded`);
    response.contentType('application/zip').status(HttpStatus.OK).send(file);
  }

  @Post(':version_id/execute')
  @ExecuteWasm()
  async executeWasm(@Res() response: Response, @Param('version_id') versionId: string, @Body() body: ExecuteWasmDto) {
    const command = new ExecuteWasmCommand(versionId, body);
    const result = await this.commandBus.execute<ExecuteWasmCommand, Result<Error, ExecResponseData>>(command);
    const payload = result.getOrThrow();

    response.status(HttpStatus.OK).send(payload);
  }

  @Post(':version_id/validation')
  @GetWasmValidations()
  async getValidations(@Res() response: Response, @Param('version_id') versionId: string) {
    const command = new GetValidationsQuery(versionId);
    const result = await this.queryBus.execute<GetValidationsQuery, Result<Error, WasmValidations>>(command);
    const payload = result.getOrThrow();

    response.status(HttpStatus.OK).send(payload);
  }

  @Get(':version_id/history')
  @GetWasmExecHistory()
  async getWasmExecHistory(
    @Res() response: Response,
    @Param('version_id') versionId: string,
    @PaginationParams() pagination: PaginationQueryParams,
    @Query('type') type: QueryType = QueryType.DATA,
  ) {
    if (type?.toLowerCase() === QueryType.DATA) {
      const query = new GetHistoryQuery(versionId, pagination);
      const result = await this.queryBus.execute<GetHistoryQuery, Result<Error, Paginated<ExecHistory>>>(query);
      const payload = result.getOrThrow();

      this.logger.log(`execution history fetched for <${versionId}>: ${payload.pagination.total_items} items`);
      response.status(HttpStatus.OK).send(payload);
    } else {
      const query = new DownloadHistoryQuery(versionId);
      const result = await this.queryBus.execute<DownloadHistoryQuery, Result<Error, Buffer>>(query);
      const file = result.getOrThrow();

      this.logger.log(`execution history file <${versionId}> has been downloaded`);
      response.contentType('text/csv').status(HttpStatus.OK).send(file);
    }
  }

  @Delete(':version_id')
  @DeleteWasmFile()
  async deleteWasmFile(@Res() response: Response, @Param('version_id') versionId: string) {
    await this.commandBus.execute<DeleteWasmCommand, Result<Error, void>>(new DeleteWasmCommand(versionId));
    this.logger.log(`wasm file <${versionId}> has been deleted`);
    response.status(HttpStatus.NO_CONTENT).send();
  }
}
