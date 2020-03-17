import { Request, Response } from 'express';

export type FormSubmissionProcessorConstructor = new (...args: any[]) => FormSubmissionProcessor

export interface FormSubmissionProcessor {
    process(req: Request, res?: Response): void | Promise<void>
}
