import 'reflect-metadata';

import { InversifyExpressServer } from 'inversify-express-utils';
import { getExpressAppConfig } from 'utils/ConfigLoader';

import { createContainer } from 'app/ContainerFactory';
import 'app/controllers/index';
import { defaultHandler, notFoundHandler } from 'app/middleware/ErrorHandler';


export class Server {

    private server: InversifyExpressServer;
    private port: number;

    constructor(port: number) {
        this.port = port;
        this.server = new InversifyExpressServer(createContainer());
        this.server.setConfig(getExpressAppConfig(__dirname));
    }

    public start(): void {

        const application = this.server.build();
        application.use(notFoundHandler, defaultHandler);

        application.listen(this.port, () => {
            console.log(('  App is running at http://localhost:%d in %s mode'), this.port, process.env.NODE_ENV);
            console.log('  Press CTRL-C to stop\n');
        });
    }

}
