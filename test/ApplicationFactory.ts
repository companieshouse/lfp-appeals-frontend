import { Container } from 'inversify';
import { Application, NextFunction, RequestHandler, Request, Response } from 'express';
import { InversifyExpressServer } from 'inversify-express-utils';
import { getExpressAppConfig, loadEnvironmentVariablesFromFiles } from '../src/utils/ConfigLoader';
import { AuthMiddleware } from '../src/middleware/AuthMiddleware';
import { getEnvOrDefault } from '../src/utils/EnvironmentUtils';
import { Maybe, SessionStore, EitherUtils, SessionMiddleware, Session } from 'ch-node-session-handler';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import Substitute from '@fluffy-spoon/substitute';

export const createAppConfigurable = (configureContainerBindings: (container: Container) => void = () => { }): Application => {

    loadEnvironmentVariablesFromFiles();
    const container = new Container();
    configureContainerBindings(container);
    return new InversifyExpressServer(container).setConfig(getExpressAppConfig('../../')).build();
};

export const getDefaultConfig = () => {
    loadEnvironmentVariablesFromFiles();
    return {
        cookieName: getEnvOrDefault('COOKIE_NAME'),
        cookieSecret: getEnvOrDefault('COOKIE_SECRET')
    };
};

export const createApp = (session?: Session) => createAppConfigurable(container => {

    const config = getDefaultConfig();

    const cookie = session ? Cookie.createFrom(session) : null;

    const sessionStore = Substitute.for<SessionStore>();

    if (session && cookie) {
        sessionStore.load(cookie).returns(EitherUtils.wrapValue(session.data));
    }

    const realMiddleware = SessionMiddleware(config, sessionStore);
    const sessionHandler = (req: Request, res: Response, next: NextFunction) => {
        req.session = session ? Maybe.of(session) : Maybe.empty();

        if (session && cookie) {
            req.cookies[config.cookieName] = cookie.value;
        }
        realMiddleware(req, res, next);
    };


    container.bind<AuthMiddleware>(AuthMiddleware).toConstantValue(new AuthMiddleware());
    container.bind<RequestHandler>(SessionMiddleware).toConstantValue(sessionHandler);
    container.bind(SessionStore).toConstantValue(sessionStore);

});
