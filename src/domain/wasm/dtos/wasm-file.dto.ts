export class WasmFileDto {
  constructor(
    readonly versionId: string,
    readonly fileName: string,
    readonly path: string,
    readonly originalName: string,
    readonly size: number,
    readonly uploadedAt: number,
    public serviceName?: string,
    public revision?: string,
    public username?: string,
  ) {}
}
