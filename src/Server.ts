import 'reflect-metadata';

import { ApplicationFactory } from 'app/ApplicationFactory';
import 'app/controllers/index';

export class Server {
    constructor(private port: number) {}

    public start(): void {
        ApplicationFactory.createInstance().listen(this.port, () => {
            console.log(('  App is running at http://localhost:%d in %s mode'), this.port, process.env.NODE_ENV);
            console.log('  Press CTRL-C to stop\n');
        });
    }
}
