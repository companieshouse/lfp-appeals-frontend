import multer from 'multer';
import util from 'util';

import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';

const supportedFileTypes: string[] = getEnvOrThrow('SUPPORTED_MIME_TYPES').split(',');

export const parseFormData = util.promisify(
    multer({
        limits: {
            fileSize: Number(getEnvOrThrow('MAX_FILE_SIZE_BYTES'))
        },
        // @ts-ignore
        // tslint:disable-next-line: typedef
        fileFilter (request, file, cb) {
            if (!supportedFileTypes.includes(file.mimetype)) {
                return cb(new Error('File not supported'))
            }
            cb(null, true)
        }
    }).single('file')
);
