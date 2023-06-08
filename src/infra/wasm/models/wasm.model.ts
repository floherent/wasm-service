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
}

export class WasmModelHandler extends WasmModel {
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
    super(
      fields.version_id,
      fields.file_name,
      fields.path,
      fields.original_name,
      fields.size,
      fields.uploaded_at,
      fields.service_name,
      fields.revision,
      fields.username,
    );
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

  get asDto(): WasmModel {
    return new WasmModel(
      this.version_id,
      this.file_name,
      this.path,
      this.original_name,
      this.size,
      this.uploaded_at,
      this.service_name,
      this.revision,
      this.username,
    );
  }
}
