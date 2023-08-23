import { Request } from "express";

export interface FormActionProcessor {
    process(request: Request): void | Promise<void>;
}

export type FormActionProcessorConstructor = new (...args: any[]) => FormActionProcessor;
