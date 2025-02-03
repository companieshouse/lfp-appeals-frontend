import { NextFunction, Request, Response } from "express";
import { parseFormData } from "app/utils/MultipartFormDataParser";

export const MultipartMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log("MultipartMiddleware: before parseFormData");
        await parseFormData(req, res);
        console.log("MultipartMiddleware: after parseFormData");
    } catch (error) {
        console.error("MultipartMiddleware: Error parsing form data", error);
    }
    next();
};
