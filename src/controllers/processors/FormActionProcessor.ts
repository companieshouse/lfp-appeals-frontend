import { Request } from "express";

export type FormActionProcessorConstructor = new (...args: any[]) => FormActionProcessor;

export interface FormActionProcessor {
    process(request: Request): void | Promise<void>;
}
