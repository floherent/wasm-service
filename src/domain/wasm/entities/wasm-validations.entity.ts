export class WasmValidations {
  readonly status = 'Success';
  readonly error = null;
  readonly response_meta: Record<string, any> = {};
  constructor(version_id: string, readonly response_data: Record<string, any>) {
    this.response_meta.version_id = version_id;
  }
}
