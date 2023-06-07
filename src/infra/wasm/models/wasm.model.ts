export class WasmModel {
  private readonly _headers = [
    'version_id',
    'file_name',
    'path',
    'original_name',
    'size',
    'uploaded_at',
    'service_name',
    'revision',
    'username',
  ];

  readonly version_id: string;
  readonly file_name: string;
  readonly path: string;
  readonly original_name: string;
  readonly size: number;
  readonly uploaded_at: number;
  readonly service_name?: string;
  readonly revision?: string;
  readonly username?: string;

  constructor(
    fields: {
      version_id: string;
      file_name: string;
      path: string;
      original_name: string;
      size: number;
      uploaded_at: number;
      service_name?: string;
      revision?: string;
      username?: string;
    },
    public sep = ',',
  ) {
    this.version_id = fields.version_id;
    this.file_name = fields.file_name;
    this.path = fields.path;
    this.original_name = fields.original_name;
    this.size = fields.size;
    this.uploaded_at = fields.uploaded_at;
    this.service_name = fields.service_name;
    this.revision = fields.revision;
    this.username = fields.username;
  }

  toCsv(sep?: string): string {
    return [
      this.version_id,
      this.file_name,
      this.path,
      this.original_name,
      this.size,
      this.uploaded_at,
      this.service_name,
      this.revision,
      this.username,
    ].join(sep ?? this.sep);
  }

  headers(sep?: string): string {
    return this._headers.join(sep ?? this.sep);
  }
}
