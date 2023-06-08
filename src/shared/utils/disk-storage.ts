import { diskStorage } from 'multer';
import { AppConfig } from 'src/app.config';

export const dumpOntoDisk = (options?: { dest: string }) => {
  return diskStorage({
    destination: options?.dest ?? AppConfig.getInstance().props.app.uploadPath,
    filename: (_, file, callback) => {
      const filename = `${Date.now()}_${file.originalname}`;
      callback(null, filename);
    },
  });
};
