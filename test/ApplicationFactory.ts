import Substitute from '@fluffy-spoon/substitute';
import { EitherUtils, Session, SessionMiddleware, SessionStore } from 'ch-node-session-handler';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import { Application, NextFunction, Request, Response } from 'express';
import { Container } from 'inversify';
import { buildProviderModule } from 'inversify-binding-decorators';

import { ApplicationFactory } from 'app/ApplicationFactory';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { EmailService } from 'app/modules/email-publisher/EmailService'
import { AppealStorageService } from 'app/service/AppealStorageService';
import { FileTransferService } from 'app/service/FileTransferService';
import { loadEnvironmentVariablesFromFiles } from 'app/utils/ConfigLoader';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';

// tslint:disable-next-line:no-empty
export const createAppConfigurable = (configureBindings: (container: Container) => void = () => {}): Application => {

    loadEnvironmentVariablesFromFiles();
    const container = new Container();
    container.load(buildProviderModule());
    configureBindings(container);
    return ApplicationFactory.createInstance(container);
};

export const getDefaultConfig = () => {
    loadEnvironmentVariablesFromFiles();
    return {
        cookieName: getEnvOrThrow('COOKIE_NAME'),
        cookieSecret: getEnvOrThrow('COOKIE_SECRET')
    };
};

// tslint:disable-next-line:no-empty
export const createApp = (session?: Session, configureBindings: (container: Container) => void = () => {}) =>
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
        container.bind(AppealStorageService).toConstantValue(Substitute.for<AppealStorageService>());
        container.bind(EmailService).toConstantValue(Substitute.for<EmailService>());
        container.bind(FileTransferService).toConstantValue(Substitute.for<FileTransferService>());

        configureBindings(container);
    });
