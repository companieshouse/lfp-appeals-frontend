import { BaseHttpController } from 'inversify-express-utils';

export abstract class BaseAsyncHttpController extends BaseHttpController {
    public renderWithStatus = (code: number) =>
        async (template: string, options: any = {}): Promise<string> =>
            new Promise<string>((resolve, reject) =>
                this.httpContext.response.status(code).render(template, options, (err, compiled) => {
                    if (err) {
                        console.log(err);
                        reject('500 when rendering the template');
                    }
                    resolve(compiled);
                })
            );
    public render: (template: string, options?: any) => Promise<string> = this.renderWithStatus(200);
}