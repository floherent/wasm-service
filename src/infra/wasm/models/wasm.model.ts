export class WasmModel {
  constructor(
    readonly version_id: string,
    readonly file_name: string,
    readonly path: string,
    readonly original_name: string,
    readonly size: number,
    readonly uploaded_at: number,
    readonly service_name?: string,
    readonly revision?: string,
    readonly username?: string,
  ) {}

  toString(): string {
    return `${this.version_id},${this.file_name},${this.path},${this.original_name},${this.size},${this.uploaded_at},${this.service_name},${this.revision},${this.username}`;
  }

  get headers(): string {
    return 'version_id,file_name,path,original_name,size,uploaded_at,service_name,revision,username';
  }
}
