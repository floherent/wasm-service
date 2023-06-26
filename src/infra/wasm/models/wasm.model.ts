import { ApiProperty } from '@nestjs/swagger';

export class WasmModel {
  @ApiProperty({ format: 'uuid' })
  readonly version_id: string;

  @ApiProperty()
  readonly file_name: string;

  @ApiProperty()
  readonly file_path: string;

  @ApiProperty()
  readonly original_name: string;

  @ApiProperty()
  readonly size: number;

  @ApiProperty({ type: Date, format: 'date-time' })
  readonly uploaded_at: number | Date;

  @ApiProperty({ required: false })
  readonly service_name?: string;

  @ApiProperty({ required: false })
  readonly revision?: string;

  @ApiProperty({ required: false })
  readonly username?: string;

  constructor(
    versionId: string,
    fileName: string,
    filePath: string,
    originalName: string,
    size: number,
    uploadedAt: number | Date,
    serviceName?: string,
    revision?: string,
    username?: string,
  ) {
    this.version_id = versionId;
    this.file_name = fileName;
    this.file_path = filePath;
    this.original_name = originalName;
    this.size = size;
    this.uploaded_at = uploadedAt;
    this.service_name = serviceName;
    this.revision = revision;
    this.username = username;
  }
}

export class WasmModelHandler extends WasmModel {
  private readonly _headers = [
    'version_id',
    'file_name',
    'file_path',
    'original_name',
    'size',
    'uploaded_at',
    'service_name',
    'revision',
    'username',
  ];

  get asDto(): WasmModel {
    return new WasmModel(
      this.version_id,
      this.file_name,
      this.file_path,
      this.original_name,
      this.size,
      new Date(Number(this.uploaded_at)),
      this.service_name,
      this.revision,
      this.username,
    );
  }

  constructor(
    fields: {
      version_id: string;
      file_name: string;
      file_path: string;
      original_name: string;
      size: number;
      uploaded_at: number | Date;
      service_name?: string;
      revision?: string;
      username?: string;
    },
    public sep = ',',
  ) {
    super(
      fields.version_id,
      fields.file_name,
      fields.file_path,
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
      this.file_path,
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
