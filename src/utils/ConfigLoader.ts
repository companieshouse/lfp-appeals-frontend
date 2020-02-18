import * as dotenv from 'dotenv';
import * as express from 'express';
import * as path from 'path';
import * as nunjucks from 'nunjucks';
import bodyParser = require('body-parser');
import cookieParser = require('cookie-parser');
import { handler } from '../middleware/ErrorHandler';
import { ROOT_URI } from './Paths';

const DEFAULT_ENV_FILE = `${__dirname}/../../.env`;

const checkFileExists = (config: dotenv.DotenvConfigOutput) => {
  if (config.error) throw config.error;
  else return config;
};

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

