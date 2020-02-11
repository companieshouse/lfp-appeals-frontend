"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Server_1 = require("./Server");
const ConfigLoader_1 = require("./utils/ConfigLoader");
ConfigLoader_1.loadEnvironmentVariablesFromFiles();
const server = new Server_1.Server(Number(process.env.PORT) || 3000);
server.start();
