import { Injectable, Logger } from '@nestjs/common';
import { Spark } from '@coherentglobal/spark-execute-sdk';

@Injectable()
export class WasmService {
  private readonly logger = new Logger(WasmService.name);
  readonly wasms: Map<string, Spark> = new Map(); // FIXME: use redis or something else.

  get isEmpty(): boolean {
    return this.wasms.size === 0;
  }

  getWasm(versionId: string): Spark | undefined {
    const wasm = this.wasms.get(versionId);
    if (!wasm) this.logger.log(`no wasm found for version_id: ${versionId}`);
    return wasm;
  }

  setWasm(versionId: string, file: Buffer): Spark {
    if (this.wasms.has(versionId)) {
      this.logger.warn(`overwriting existing wasm with version_id: ${versionId}`);
    }

    const wasm = this.sparkify(versionId, file);
    this.wasms.set(versionId, wasm);
    this.logger.log(`wasm cached with version_id: ${versionId}`);
    return wasm;
  }

  private sparkify(versionId: string, buffer: Buffer): Spark {
    return new Spark({
      nodeGenModels: [
        {
          versionId: versionId,
          type: 'base64',
          binary: buffer.toString('base64'),
          metaData: {},
        },
      ],
    });
  }
}
