export class WasmFileDto {
  constructor(
    readonly versionId: string,
    readonly fileName: string,
    readonly file_path: string,
    readonly originalName: string,
    readonly size: number,
    readonly uploadedAt: number | Date,
    public serviceName?: string,
    public revision?: string,
    public username?: string,
  ) {}
}
