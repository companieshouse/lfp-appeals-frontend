import { Server } from './Server';
import { loadEnvironmentVariablesFromFiles, ENV } from './utils/ConfigLoader';

loadEnvironmentVariablesFromFiles();

const server = new Server(ENV.ERIC_PORT);
server.start();
