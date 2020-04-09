import multer, { MulterError } from 'multer';
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
                const error = new MulterError('LIMIT_UNEXPECTED_FILE');
                error.message = `${file.mimetype} is not a supported mime type`;
                return cb(error);
            }
            cb(null, true);
        }
    }).single('file')
);
