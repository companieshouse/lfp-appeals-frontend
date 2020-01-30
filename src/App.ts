import { Server } from './Server';
/**
 * Instantiates and starts the server.
 */
const server = new Server(Number(process.env.PORT) || 3000);
server.start();
