import 'reflect-metadata'

import { Arg } from '@fluffy-spoon/substitute';
import { EitherUtils, ISession, Maybe, Session, SessionStore } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { Request, Response } from 'express';
import { OK } from 'http-status-codes';
import { Container } from 'inversify';
import { buildProviderModule } from 'inversify-binding-decorators';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { FormSubmissionProcessor } from 'app/controllers/processors/FormSubmissionProcessor';
import { ApplicationData, APPEALS_KEY } from 'app/models/ApplicationData';
import { PENALTY_DETAILS_PAGE_URI } from 'app/utils/Paths';

import { createSubstituteOf } from 'test/SubstituteFactory';

const template = 'template';
const navigation = {
    previous(): string {
        return '/previous'
    },
    next(): string {
        return '/next'
    }
};

type ControllerConfig = {
    httpContext: {
        container?: Container
        request?: Partial<Request>
        response: Partial<Response>
    }
    processor?: new (...args:any[]) => FormSubmissionProcessor
}

function createTestController(config: ControllerConfig): any {
    // tslint:disable-next-line:new-parens
    return new class extends SafeNavigationBaseController<any> {
        constructor() {
            super(template, navigation , undefined, undefined,
                config.processor ? [config.processor] : []);
            // @ts-ignore: ignores the fact that http context is readonly
            this.httpContext = config.httpContext
        }
        protected prepareViewModelFromAppeal(): any {
            return {};
        }
    }
}

describe('Safe navigation base controller', () => {
    describe('GET handler', () => {
        it ('should redirect to start of the journey when user holds no navigation passes', () => {
            const response = createSubstituteOf<Response>();

            createTestController({
                httpContext: {
                    request: {
                        url: '/summary',
                        session: Maybe.of(new Session({}))
                    },
                    response
                }
            }).onGet();

            // @ts-ignore
            response.received().redirect(PENALTY_DETAILS_PAGE_URI);
        });

        it ('should redirect to last page user progressed to when user holds no navigation pass for page', () => {
            const response = createSubstituteOf<Response>();

            createTestController({
                httpContext: {
                    request: {
                        url: '/summary',
                        session: Maybe.of(new Session({
                            [SessionKey.ExtraData]: {
                                [APPEALS_KEY]: {
                                    navigation: {
                                        permissions: ['/intro']
                                    }
                                } as Partial<ApplicationData>
                            }
                        }))
                    },
                    response
                }
            }).onGet();

            // @ts-ignore
            response.received().redirect('/intro');
        });

        it ('should render visited page when user holds navigation pass for page', () => {
            const response = createSubstituteOf<Response>(substitute => {
                substitute.status(Arg.any()).returns(substitute);
            });

            createTestController({
                httpContext: {
                    request: {
                        url: '/intro',
                        query: {},
                        session: Maybe.of(new Session({
                            [SessionKey.ExtraData]: {
                                [APPEALS_KEY]: {
                                    navigation: {
                                        permissions: ['/intro']
                                    }
                                } as Partial<ApplicationData>
                            }
                        }))
                    },
                    response
                }
            }).onGet();

            response.received().status(OK);
            // @ts-ignore
            response.received().render(response, template, Arg.any());
        });
    });

    describe('POST handler', () => {
        it ('should store navigation pass for unique page that user is about to be redirected to', () => {
            process.env.COOKIE_SECRET = 'super long and very secure secret';

            const sessionStore = createSubstituteOf<SessionStore>(substitute => {
                substitute.store(Arg.any()).returns(EitherUtils.wrapValue('1'));
            });

            const container = new Container();
            container.load(buildProviderModule());
            container.bind(SessionStore).toConstantValue(sessionStore);

            createTestController({
                httpContext: {
                    container,
                    request: {
                        url: '/intro',
                        query: {},
                        session: Maybe.of(new Session({
                            [SessionKey.Id]: 'cookie-id'
                        }))
                    },
                    response: createSubstituteOf<Response>()
                }
            }).onPost();

            sessionStore.received().store(Arg.any(), Arg.is((session: ISession) => {
                if (session == null) {
                    return true;
                }
                const applicationData = session[SessionKey.ExtraData][APPEALS_KEY] as ApplicationData;
                return applicationData.navigation.permissions === ['/next'];
            }))
        });

        it ('should not store navigation pass for already visited page that user is about to be redirected to', () => {
            const sessionStore = createSubstituteOf<SessionStore>(substitute => {
                substitute.store(Arg.any()).returns(EitherUtils.wrapValue('OK'));
            });

            const container = new Container();
            container.load(buildProviderModule());
            container.bind(SessionStore).toConstantValue(sessionStore);

            createTestController({
                httpContext: {
                    container,
                    request: {
                        url: '/intro',
                        query: {},
                        session: Maybe.of(new Session({
                            [SessionKey.ExtraData]: {
                                [APPEALS_KEY]: {
                                    navigation: {
                                        permissions: ['/next']
                                    }
                                } as Partial<ApplicationData>
                            }
                        }))
                    },
                    response: createSubstituteOf<Response>()
                }
            }).onPost();

            sessionStore.didNotReceive().store(Arg.any(), Arg.any())
        });

        it ('should not store navigation pass when no redirect is about to be made', () => {
            // tslint:disable-next-line:max-classes-per-file
            class SadProcessor implements FormSubmissionProcessor {
                process(): void | Promise<void> {
                    return Promise.reject(new Error(':('));
                }
            }

            const sessionStore = createSubstituteOf<SessionStore>(substitute => {
                substitute.store(Arg.any()).returns(EitherUtils.wrapValue('OK'));
            });

            const container = new Container();
            container.load(buildProviderModule());
            container.bind(SessionStore).toConstantValue(sessionStore);
            container.bind(SadProcessor).toConstantValue(new SadProcessor());

            createTestController({
                httpContext: {
                    container,
                    request: {
                        url: '/intro',
                        query: {},
                        session: Maybe.of(new Session({}))
                    },
                    response: createSubstituteOf<Response>()
                },
                processor: SadProcessor,
            }).onPost();

            sessionStore.didNotReceive().store(Arg.any(), Arg.any())
        });
    })
});
