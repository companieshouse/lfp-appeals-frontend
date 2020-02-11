"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const inversify_express_utils_1 = require("inversify-express-utils");
require("./controllers/index");
const ContainerFactory_1 = require("./ContainerFactory");
const ConfigLoader_1 = require("./utils/ConfigLoader");
class Server {
    constructor(port) {
        this.port = port;
        this.server = new inversify_express_utils_1.InversifyExpressServer(ContainerFactory_1.createContainer());
        this.server.setConfig(ConfigLoader_1.getExpressAppConfig(__dirname));
    }
    start() {
        this.server.build().listen(this.port, () => {
            console.log(('  App is running at http://localhost:%d in %s mode'), this.port, process.env.NODE_ENV);
            console.log('  Press CTRL-C to stop\n');
        });
    }
}
exports.Server = Server;
