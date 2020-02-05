import { Server } from './Server';
import { loadEnvironmentVariablesFromFiles } from './utils/ConfigLoader';

loadEnvironmentVariablesFromFiles();

const server = new Server(Number(process.env.PORT) || 3000);
server.start();
