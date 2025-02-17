import { Application } from "express";
import { Container } from "inversify";
import { InversifyExpressServer } from "inversify-express-utils";

import { createContainer } from "app/ContainerFactory";
import { defaultHandler, notFoundHandler } from "app/middleware/ErrorHandler";
import { createExpressConfigFunction } from "app/utils/ExpressConfigFunctionFactory";

export class ApplicationFactory {
    public static createInstance (container: Container = createContainer()): Application {

        const server = new InversifyExpressServer(container);
        server.setConfig(createExpressConfigFunction(__dirname));

        const application: Application = server.build();
        application.use(notFoundHandler, defaultHandler);
        return application;
    }
}
