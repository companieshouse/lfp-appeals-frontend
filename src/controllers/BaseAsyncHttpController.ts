import { Response } from 'express';
import { BaseHttpController } from 'inversify-express-utils';
import * as util from 'util';

export abstract class BaseAsyncHttpController extends BaseHttpController {
    public renderWithStatus = (code: number) =>  async (template: string, options: any = {}): Promise<void> => {
        const response: Response = this.httpContext.response.status(code);
        return util.promisify<string, any, void>(response.render).call(response, template, options);
    };

    public render: (template: string, options?: any) => Promise<void> = this.renderWithStatus(200);
}
