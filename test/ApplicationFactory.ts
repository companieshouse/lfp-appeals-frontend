import Substitute from '@fluffy-spoon/substitute';
import { EitherUtils, Session, SessionMiddleware, SessionStore } from 'ch-node-session-handler';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import { Application, NextFunction, Request, Response } from 'express';
import { Container } from 'inversify';
import { buildProviderModule } from 'inversify-binding-decorators';

import { ApplicationFactory } from 'app/ApplicationFactory';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { EmailService } from 'app/modules/email-publisher/EmailService';
import { FileTransferService } from 'app/modules/file-transfer-service/FileTransferService';
import { AppealStorageService } from 'app/service/AppealStorageService';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';

import { createSession } from 'test/utils/session/SessionFactory';

// tslint:disable-next-line:no-empty
export const createAppConfigurable = (configureBindings: (container: Container) => void = () => {}): Application => {

    const container = new Container();
    container.load(buildProviderModule());
    configureBindings(container);
    return ApplicationFactory.createInstance(container);
};

export const createApp = (data?: Partial<ApplicationData>,
                          // tslint:disable-next-line:no-empty
                          configureBindings: (container: Container) => void = () => {}) =>
    createAppConfigurable(container => {
        const cookieName = getEnvOrThrow('COOKIE_NAME');
        const cookieSecret = getEnvOrThrow('COOKIE_SECRET');

        const session: Session | undefined = data ? createSession(cookieSecret)
            .saveExtraData(APPLICATION_DATA_KEY, data) : undefined;

        const cookie = session ? Cookie.representationOf(session, cookieSecret) : null;

        const sessionStore = Substitute.for<SessionStore>();

        if (session && cookie) {
            sessionStore.load(cookie).returns(EitherUtils.wrapValue(session.data));
        }

        container.bind(SessionMiddleware).toConstantValue((req: Request, res: Response, next: NextFunction) => {
            if (session && cookie) {
                req.cookies[cookieName] = cookie.value;
            }
            SessionMiddleware({ cookieName, cookieSecret }, sessionStore)(req, res, next);
        });
        container.bind(SessionStore).toConstantValue(sessionStore);
        container.bind(AppealStorageService).toConstantValue(Substitute.for<AppealStorageService>());
        container.bind(EmailService).toConstantValue(Substitute.for<EmailService>());
        container.bind(FileTransferService).toConstantValue(Substitute.for<FileTransferService>());

        configureBindings(container);
    });
