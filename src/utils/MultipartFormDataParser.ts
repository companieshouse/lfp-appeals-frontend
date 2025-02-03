import multer, { MulterError } from "multer";
import util from "util";

import { getEnvOrThrow } from "app/utils/EnvironmentUtils";

const supportedFileTypes: string[] = getEnvOrThrow("SUPPORTED_MIME_TYPES").split(",");

export const parseFormData = util.promisify(
    multer({
        limits: {
            fileSize: Number(getEnvOrThrow("MAX_FILE_SIZE_BYTES"))
        },
        // @ts-ignore

        fileFilter (request, file, cb) {

            console.log("NSDBG fileFilter inside parseFormData request.body:", request.body);
            if (!supportedFileTypes.includes(file.mimetype)) {
                const error = new MulterError("LIMIT_UNEXPECTED_FILE");
                error.message = `${file.mimetype} is not a supported mime type`;
                return cb(error);
            }
            cb(null, true);
        }
    }).fields([{ name: "file", maxCount: 1 }, { name: "_csrf", maxCount: 1 }])
);
