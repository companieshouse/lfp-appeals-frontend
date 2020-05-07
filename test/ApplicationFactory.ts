import Substitute from '@fluffy-spoon/substitute';
import { Session, SessionMiddleware, SessionStore } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { Cookie } from 'ch-node-session-handler/lib/session/model/Cookie';
import { Application, NextFunction, Request, Response } from 'express';
import { Container } from 'inversify';
import { buildProviderModule } from 'inversify-binding-decorators';

import { ApplicationFactory } from 'app/ApplicationFactory';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { AppealsService } from 'app/modules/appeals-service/AppealsService';
import { EmailService } from 'app/modules/email-publisher/EmailService';
import { FileTransferService } from 'app/modules/file-transfer-service/FileTransferService';
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
    configureBindings: (container: Container) => void = () => {},
    configureSession: (session: Session) => Session = (_: Session) => _) =>
    createAppConfigurable(container => {

        const cookieName = getEnvOrThrow('COOKIE_NAME');
        const cookieSecret = getEnvOrThrow('COOKIE_SECRET');

        let session: Session | undefined = configureSession(createSession(cookieSecret));

        const sessionId: string | undefined = session!.data[SessionKey.Id];
        const signature: string | undefined = session!.data[SessionKey.ClientSig];

        if (data) {
            session.setExtraData(APPLICATION_DATA_KEY, data);
        }
        else {
            session = undefined;
        }

        const cookie: Cookie | null = session ? Cookie.createFrom(sessionId! + signature) : null;

        const sessionStore = Substitute.for<SessionStore>();

        if (session && cookie) {
            sessionStore.load(cookie).resolves(session.data);
        }

        container.bind(SessionMiddleware).toConstantValue((req: Request, res: Response, next: NextFunction) => {
            if (session && cookie) {
                req.cookies[cookieName] = cookie.value;
            }
            SessionMiddleware({ cookieName, cookieSecret }, sessionStore)(req, res, next);
        });
        container.bind(SessionStore).toConstantValue(sessionStore);
        container.bind(AppealsService).toConstantValue(Substitute.for<AppealsService>());
        container.bind(EmailService).toConstantValue(Substitute.for<EmailService>());
        container.bind(FileTransferService).toConstantValue(Substitute.for<FileTransferService>());
        configureBindings(container);
    });
