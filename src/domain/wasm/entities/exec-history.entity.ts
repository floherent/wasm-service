export class ExecHistory {
  constructor(
    readonly versionId: string,
    readonly inputs: string,
    readonly outputs: string,
    readonly executedAt: number,
    readonly executionTime: string,
    readonly serviceName?: string,
    readonly revision?: string,
  ) {}
}
