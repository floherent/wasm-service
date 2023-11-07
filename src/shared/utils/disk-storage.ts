import { v4 as uuid } from 'uuid';
import { diskStorage } from 'multer';
import { readdirSync, statSync } from 'fs';
import { extname, join } from 'path';

import { AppConfig, Config } from '@app/modules/config';
import { ONE_KB, ONE_MB } from '@shared/constants';

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

export const getFolderSize = (folderPath: string) => {
  let totalSize = 0;

  const calculateSize = (filePath: string): void => {
    const stats = statSync(filePath);

    if (stats.isDirectory()) {
      const files = readdirSync(filePath);
      files.forEach((file) => {
        const nestedFilePath = join(filePath, file);
        calculateSize(nestedFilePath);
      });
    } else if (stats.isFile()) {
      totalSize += stats.size;
    }
  };

  calculateSize(folderPath);

  // Convert size to human-readable format
  const inBytes = totalSize;
  const inKilobytes = inBytes / ONE_KB;
  const inMegabytes = inKilobytes / ONE_KB;
  const inGigabytes = inMegabytes / ONE_KB;

  return {
    bytes: inBytes,
    kb: inKilobytes,
    mb: inMegabytes,
    gb: inGigabytes,
  };
};

export const getMemoryUsage = (config?: Config) => {
  const { heapTotal, heapUsed, rss } = process.memoryUsage();
  const { health } = config ?? AppConfig.getInstance().props;
  return {
    rss: Math.round(rss / ONE_MB),
    heap_total: Math.round(heapTotal / ONE_MB),
    heap_used: Math.round(heapUsed / ONE_MB),
    threshold: {
      disk: health.diskThresholdPercent,
      wasm: health.wasmThreshold,
      memory: health.memoryThreshold,
    },
  };
};
