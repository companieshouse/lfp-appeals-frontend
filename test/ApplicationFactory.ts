import { Container } from 'inversify';
import { Application, NextFunction, RequestHandler, Request, Response } from 'express';
import { InversifyExpressServer, BaseMiddleware } from 'inversify-express-utils';
import { getExpressAppConfig } from '../src/utils/ConfigLoader'
import { AuthMiddleware } from '../src/middleware/AuthMiddleware';

export const createApplication = (configureContainerBindings: (container: Container) => void = () => {}): Application => {
    const container = new Container();
    configureContainerBindings(container);
    return new InversifyExpressServer(container).setConfig(getExpressAppConfig('../../')).build();
};

export const setupFakeAuth = (container: Container) => {
    const fakeHandler = (req: Request, res: Response, next: NextFunction) => {
        return next();
    };

    class FakeMiddleware extends AuthMiddleware {
        handler: RequestHandler = fakeHandler;
    }

    const newFakeMiddleware = new FakeMiddleware()
    container.bind<AuthMiddleware>(AuthMiddleware).toConstantValue(newFakeMiddleware);
}