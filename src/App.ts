import express from 'express';
import * as nunjucks from 'nunjucks';
import './Bootstrap';
import './LoadConfig';

import { Server } from 'app/Server';

const app = express();


// view engine setup
const env = nunjucks.configure([
    'views',
    'node_modules/govuk-frontend/',
    'node_modules/govuk-frontend/components/',
  ], {
    autoescape: true,
    express: app,
  });
  env.addGlobal('CHS_URL', process.env.CHS_URL);
  env.addGlobal('assetPath', process.env.CDN_HOST);
  env.addGlobal('PIWIK_URL', process.env.PIWIK_URL);
  env.addGlobal('PIWIK_SITE_ID', process.env.PIWIK_SITE_ID);
//   env.addGlobal("ERROR_SUMMARY_TITLE", ErrorMessages.ERROR_SUMMARY_TITLE);
// ^^^^ orginally a link to a .ts file containing alll enums for error msgs and codes...


const server = new Server(Number(process.env.PORT) || 3000);
server.start();
