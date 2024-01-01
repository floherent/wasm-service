export class WasmData {
  constructor(
    readonly version_id: string,
    readonly file_name: string,
    readonly file_path: string,
    readonly original_name: string,
    readonly size: number,
    readonly uploaded_at: number | Date,
    readonly service_name?: string,
    readonly revision?: string,
    readonly username?: string,
  ) {}
}
