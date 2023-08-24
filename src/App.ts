import "./Bootstrap";
import "./LoadConfig";

import { Server } from "app/Server";

const server = new Server(Number(process.env.PORT) || 3000);
server.start();
