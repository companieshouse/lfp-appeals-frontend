import './Bootstrap'

import { loadEnvironmentVariablesFromFiles } from 'app/utils/ConfigLoader';
loadEnvironmentVariablesFromFiles();

// tslint:disable-next-line: ordered-imports
import { Server } from 'app/Server';

const server = new Server(Number(process.env.PORT) || 3000);
server.start();
