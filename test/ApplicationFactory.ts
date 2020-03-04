import Substitute from '@fluffy-spoon/substitute';
import { EitherUtils, Maybe, Session, SessionMiddleware, SessionStore } from 'ch-node-session-handler';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import { Application, NextFunction, Request, RequestHandler, Response } from 'express';
import { Container } from 'inversify';
import { InversifyExpressServer } from 'inversify-express-utils';
import { AuthMiddleware } from 'middleware/AuthMiddleware';
import { EmailService } from 'modules/email-publisher/EmailService'
import { getExpressAppConfig, loadEnvironmentVariablesFromFiles } from 'utils/ConfigLoader';
import { getEnvOrDefault } from 'utils/EnvironmentUtils';

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

export const createApp = (session?: Session, configureContainerBindings: (container: Container) => void = () => {}) =>
    createAppConfigurable(container => {

        const config = getDefaultConfig();

        const cookie = session ? Cookie.representationOf(session, config.cookieSecret) : null;

        const sessionStore = Substitute.for<SessionStore>();

        if (session && cookie) {
            sessionStore.load(cookie).returns(EitherUtils.wrapValue(session.data));
        }

        const realMiddleware = SessionMiddleware(config, sessionStore);
        const sessionHandler = (req: Request, res: Response, next: NextFunction) => {
            if (session && cookie) {
                req.cookies[config.cookieName] = cookie.value;
            }
            realMiddleware(req, res, next);
        };


        container.bind(AuthMiddleware).toConstantValue(new AuthMiddleware());
        container.bind(SessionMiddleware).toConstantValue(sessionHandler);
        container.bind(SessionStore).toConstantValue(sessionStore);

        container.bind(EmailService).toConstantValue(Substitute.for<EmailService>())

        configureContainerBindings(container);
    });
