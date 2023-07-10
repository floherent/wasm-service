import { v4 as uuid } from 'uuid';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { AppConfig } from '@app/modules/config';

export const dumpOntoDisk = (options?: { dest: string }) => {
  return diskStorage({
    destination: options?.dest ?? AppConfig.getInstance().props.app.uploadPath,
    filename: (request, file, callback) => {
      const versionId = request.params?.version_id ?? uuid();
      const extension = extname(file.originalname);
      callback(null, `${versionId}${extension}`);
    },
  });
};
