import { Logger, HttpStatus } from '@nestjs/common';
import { Controller, Get, Post, Body, Delete, Param, Headers, Query, Res } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { Result } from 'typescript-result';

import { Batch, BatchExec, GetBatchQuery, GetBatchResultQuery, ExecuteBatchDto, IdsDto } from '@domain/batch';
import { GetBatchFileQuery, CreateBatchCommand, DeleteBatchResultsCommand } from '@domain/batch';
import { CreateBatch, GetBatchStatus, GetBatchResuls, DeleteBatchFiles } from '@shared/docs';
import { QueryType } from '@shared/utils';

@ApiTags('batch')
@Controller({ path: 'batch', version: '1' })
export class BatchController {
  private readonly logger = new Logger(BatchController.name);

  constructor(private readonly commandBus: CommandBus, private readonly queryBus: QueryBus) {}

  @Post(':service_id')
  @CreateBatch()
  async createBatch(
    @Res() response: Response,
    @Param('service_id') serviceId: string,
    @Headers('Ws-Client-Id') clientId: string | undefined,
    @Body() body: ExecuteBatchDto,
  ) {
    const command = new CreateBatchCommand(serviceId, clientId, body);
    const result = await this.commandBus.execute<CreateBatchCommand, Result<Error, Batch>>(command);
    const payload = result.getOrThrow();

    response.status(HttpStatus.CREATED).send(payload);
  }

  @Get(':batch_id/status')
  @GetBatchStatus()
  async getBatchStatus(@Res() response: Response, @Param('batch_id') batchId: string) {
    const query = new GetBatchQuery(batchId);
    const result = await this.queryBus.execute<GetBatchQuery, Result<Error, Batch>>(query);
    const payload = result.getOrThrow();

    response.status(HttpStatus.OK).send(payload);
  }

  @Get(':batch_id/results')
  @GetBatchResuls()
  async getBatchResults(
    @Res() response: Response,
    @Param('batch_id') batchId: string,
    @Query('type') type: QueryType = QueryType.DATA,
  ) {
    if (type?.toLowerCase() === QueryType.DATA) {
      const query = new GetBatchResultQuery(batchId);
      const result = await this.queryBus.execute<GetBatchResultQuery, Result<Error, BatchExec[]>>(query);
      const payload = result.getOrThrow();

      response.status(HttpStatus.OK).send(payload);
    } else {
      const query = new GetBatchFileQuery(batchId);
      const result = await this.queryBus.execute<GetBatchFileQuery, Result<Error, Buffer>>(query);
      const file = result.getOrThrow();

      this.logger.log(`batch <${batchId}> file has been downloaded`);
      response.contentType('text/csv').status(HttpStatus.OK).send(file);
    }
  }

  @Delete()
  @DeleteBatchFiles()
  async deleteFiles(@Res() response: Response, @Body() body: IdsDto) {
    const command = new DeleteBatchResultsCommand(body.ids);
    const payload = await this.commandBus.execute<DeleteBatchResultsCommand, Result<Error, number>>(command);
    const count = payload.getOrThrow();

    this.logger.log(`batch files <${count || 0}/${body.ids.length}> have been deleted`);
    response.status(HttpStatus.NO_CONTENT).send();
  }
}
