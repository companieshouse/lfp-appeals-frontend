import multer from 'multer';
import util from 'util';

import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';

export const parseFormData = util.promisify(
    multer({
        limits: {
            fileSize: parseInt(getEnvOrThrow('MAX_FILE_SIZE_BYTES'), 10)
        }
    }).single('file')
);
