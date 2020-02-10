import 'reflect-metadata';
import { InversifyExpressServer } from 'inversify-express-utils';
import './controllers/Index';
import { createContainer } from './ContainerFactory';
import { getExpressAppConfig } from './utils/ConfigLoader';

export class Server {

  private server: InversifyExpressServer;
  private port: number;

  constructor(port: number) {
    this.port = port;
    this.server = new InversifyExpressServer(createContainer());
    this.server.setConfig(getExpressAppConfig(__dirname));
  }

  public start(): void {
    this.server.build().listen(this.port, () => {
      console.log(('  App is running at http://localhost:%d in %s mode'), this.port, process.env.NODE_ENV);
      console.log('  Press CTRL-C to stop\n');
    });
  }

}
