import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as nunjucks from 'nunjucks';
import 'reflect-metadata';
import * as path from 'path';
import { SessionHandlerInstance } from './middleware/SessionHandler';
import { Container } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';
import './controllers/HomeController';

export class Server {

  private server: InversifyExpressServer;
  private port: number;

  constructor(port: number) {
    this.port = port;
    let container = new Container();
    this.server = new InversifyExpressServer(new Container());
    this.server.setConfig((app) => {
      app.set('port', port);
      this.setupStaticFolders(app);
      this.setupParsers(app);
      this.setViewEngine(app);
      this.setupAppConfig(app);
    });

  }

  public start(): void {
    this.server.build().listen(this.port, () => {
      console.log(('  App is running at http://localhost:%d in %s mode'), this.port, process.env.NODE_ENV);
      console.log('  Press CTRL-C to stop\n');
    });
  }

  private setupStaticFolders(app: express.Application): void {
    app.use(express.static(path.join(__dirname, '/public')));
    app.use(express.static(path.join(__dirname, '/node_modules/govuk-frontend')));
    app.use(express.static(path.join(__dirname, '/node_modules/govuk-frontend/govuk/')));
    app.use(express.static(path.join(__dirname, '/node_modules/govuk-frontend/govuk/assets')));

  }

  private setupParsers(app: express.Application): void {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());
  }

  private setViewEngine(app: express.Application): void {
    app.set('view engine', 'njk');
    nunjucks.configure([
      'src/views',
      'node_modules/govuk-frontend',
      'node_modules/govuk-frontend/components',
    ], {
      autoescape: true,
      express: app,
    });
  }

  private setupAppConfig(app: express.Application): void {
    const sessionHandler = SessionHandlerInstance();
    const clientSessions = sessionHandler.createNewSession();
    clientSessions.set('Hello', 'Test', console.log);
  }

}
