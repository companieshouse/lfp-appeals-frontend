import { Server } from './Server';
import { loadEnvironmentVariablesFromFiles } from './utils/ConfigLoader';

/**
 * Load environment config from files.
 */
loadEnvironmentVariablesFromFiles();
/**
 * Instantiates and starts the server.
 */
const server = new Server(Number(process.env.PORT) || 3000);
server.start();
