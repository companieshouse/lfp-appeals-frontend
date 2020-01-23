import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import * as session from 'express-session';
import * as nunjucks from 'nunjucks';
import * as path from 'path';
import { router } from './routes/Routes';

export class Server {

  private app: express.Express;

  constructor(port?: number) {
    this.app = express();
    this.app.set('port', process.env.PORT || port || 3000);
    this.setupStaticFolders(this.app);
    this.setupParsers(this.app);
    this.setViewEngine(this.app);
    this.setupAppConfig(this.app);
  }

  public start(): void {
    this.app.listen(this.app.get('port'), () => {
      console.log(('  App is running at http://localhost:%d in %s mode'), this.app.get('port'), this.app.get('env'));
      console.log('  Press CTRL-C to stop\n');
    });
  }

  private setupStaticFolders(app: express.Express): void {
    app.use(express.static(path.join(__dirname, '/public')));
    app.use(express.static(path.join(__dirname, '/node_modules/govuk-frontend')));
    app.use(express.static(path.join(__dirname, '/node_modules/govuk-frontend/govuk/')));
    app.use(express.static(path.join(__dirname, '/node_modules/govuk-frontend/govuk/assets')));

  }

  private setupParsers(app: express.Express): void {
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());
  }

  private setViewEngine(app: express.Express): void {
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

  private setupAppConfig(app: express.Express): void {
    app.use(session({ secret: 'secret', resave: true, saveUninitialized: false }));
    app.use(router);
  }

}
