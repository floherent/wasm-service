import { diskStorage } from 'multer';
// import { join, extname } from 'path';

export const dumpOntoDisk = () => {
  return diskStorage({
    destination: './uploads',
    filename: (_, file, callback) => {
      // const extension = extname(file.originalname);
      const filename = `${Date.now()}_${file.originalname}`;
      callback(null, filename);
    },
  });
};
