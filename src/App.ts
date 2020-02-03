import { Server } from './Server';
import { loadConfig } from './utils/Config';

/**
 * Load environment config.
 */
const config = loadConfig();
if (config.error)
    console.error(config.error);
/**
 * Instantiates and starts the server.
 */
const server = new Server(Number(process.env.PORT) || 3000);
server.start();
