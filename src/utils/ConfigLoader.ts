import * as dotenv from 'dotenv';
import * as express from 'express';
import * as path from 'path';
import * as nunjucks from 'nunjucks';
import bodyParser = require('body-parser');
import cookieParser = require('cookie-parser');
import { handler } from '../middleware/ErrorHandler';
import { sessionMocker } from '../middleware/SessionMocker';
import { ROOT_URI, SUBMISSION_SUMMARY_PAGE_URI, CONFIRMATION_PAGE_URI } from './Paths';

const DEFAULT_ENV_FILE = `${__dirname}/../../.env`;

const checkFileExists = (config: dotenv.DotenvConfigOutput) => {
    if (config.error) throw config.error;
    else return config;
};

export let ENV: IConfig;

export const loadEnvironmentVariablesFromFiles = () => {
    dotenv.config({ path: DEFAULT_ENV_FILE });
    if (process.env.NODE_ENV) {
        const envFilePath = `${__dirname}/../../.env.${process.env.NODE_ENV}`;
        checkFileExists(dotenv.config({ path: envFilePath }));
    }
};

export const getExpressAppConfig = (directory: string) => (app: express.Application): void => {
    app.use(ROOT_URI, express.static(path.join(directory, '/public')));
    app.use(ROOT_URI, express.static(path.join(directory, '/node_modules/govuk-frontend')));
    app.use(ROOT_URI, express.static(path.join(directory, '/node_modules/govuk-frontend/govuk')));
    app.use(ROOT_URI, express.static(path.join(directory, '/node_modules/govuk-frontend/govuk/assets')));

    app.use(handler);
    app.use(SUBMISSION_SUMMARY_PAGE_URI, sessionMocker)
    app.use(CONFIRMATION_PAGE_URI, sessionMocker);

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());

    app.set('view engine', 'njk');
    nunjucks.configure([
        'dist/views',
        'node_modules/govuk-frontend',
        'node_modules/govuk-frontend/components',
    ], {
        autoescape: true,
        express: app,
    });

    app.locals.ROOT_URI = ROOT_URI;
};

function checkIfVariableExists(name: string, defaultVal?: string): string {

  const variable = process.env[name];

  if (!variable) {
    if (defaultVal !== undefined) {
      return defaultVal;
    }
    throw Error(`Variable ${name} was not found on env files.`);
  }

  return variable;
}

class Config implements IConfig {
  public readonly CACHE_SERVER: string;
  public readonly ERIC_PORT: number;
  public readonly CACHE_DB: number;
  public readonly CACHE_PASSWORD: string;
  public readonly COOKIE_NAME: string;
  public readonly COOKIE_SECRET: string;
  public readonly DEFAULT_SESSION_EXPIRATION: number;

  public constructor() {
    this.ERIC_PORT = Number(checkIfVariableExists('ERIC_PORT'));
    this.CACHE_SERVER = checkIfVariableExists('CACHE_SERVER');
    this.CACHE_DB = Number(checkIfVariableExists('CACHE_DB'));
    this.CACHE_PASSWORD = checkIfVariableExists('CACHE_PASSWORD', '');
    this.COOKIE_NAME = checkIfVariableExists('COOKIE_NAME');
    this.COOKIE_SECRET = checkIfVariableExists('COOKIE_SECRET');
    this.DEFAULT_SESSION_EXPIRATION = Number(checkIfVariableExists('DEFAULT_SESSION_EXPIRATION'));
  }


}

