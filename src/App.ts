import './Bootstrap'

import { Server } from 'app/Server';
import { loadEnvironmentVariablesFromFiles } from 'app/utils/ConfigLoader';

loadEnvironmentVariablesFromFiles();

const server = new Server(Number(process.env.PORT) || 3000);
server.start();
