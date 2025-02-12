import { NextFunction, Request, Response } from "express";
import { MulterError } from "multer";
import { parseFormData } from "app/utils/MultipartFormDataParser";

interface FileUploadRequest extends Request {
    fileUploadError?: MulterError;
}

export const MultipartMiddleware = async (req: FileUploadRequest, res: Response, next: NextFunction) => {
    try {
        console.log("MultipartMiddleware: before parseFormData");
        await parseFormData(req, res);
        console.log("MultipartMiddleware: after parseFormData");
        return next();
    } catch (error) {
        console.error("MultipartMiddleware: Error parsing form data", error);
        if (error instanceof MulterError) {
            req.fileUploadError = error;
        }
        return next();
    }
};
