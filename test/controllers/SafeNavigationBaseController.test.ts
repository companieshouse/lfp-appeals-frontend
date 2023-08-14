import 'reflect-metadata';

import { ISession, Session, SessionStore } from '@companieshouse/node-session-handler';
import { SessionKey } from '@companieshouse/node-session-handler/lib/session/keys/SessionKey';
import { Cookie } from '@companieshouse/node-session-handler/lib/session/model/Cookie';
import { Arg, Substitute } from '@fluffy-spoon/substitute';
import * as assert from 'assert';
import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { Container } from 'inversify';
import { buildProviderModule } from 'inversify-binding-decorators';

import { SafeNavigationBaseController } from 'app/controllers/SafeNavigationBaseController';
import { FormActionProcessor } from 'app/controllers/processors/FormActionProcessor';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { PENALTY_DETAILS_PAGE_URI } from 'app/utils/Paths';

import { createSubstituteOf } from 'test/SubstituteFactory';

const template = 'template';
const navigation = {
    previous(): string {
        return '/previous';
    },
    next(): string {
        return '/next';
    },
    signOut(): string {
        return '/signOut';
    },
};

type ControllerConfig = {
    httpContext: {
        container?: Container
        request?: Partial<Request>
        response: Partial<Response>
    }
    processor?: new (...args: any[]) => FormActionProcessor
};

function createTestController(config: ControllerConfig): any {
    // tslint:disable-next-line:new-parens
    return new class extends SafeNavigationBaseController<any> {
        constructor() {
            super(template, navigation, undefined, undefined,
                config.processor ? [config.processor] : []);
            // @ts-ignore: ignores the fact that http context is readonly
            this.httpContext = config.httpContext;
        }
        protected prepareViewModelFromAppeal(): any {
            return {};
        }
    };
}

describe('Safe navigation base controller', () => {
    describe('GET handler', () => {
        it('should redirect to start of the journey when user holds no navigation passes', async () => {
            const response = createSubstituteOf<Response>();

            const result = await createTestController({
                httpContext: {
                    request: {
                        url: '/summary',
                        session: new Session({})
                    },
                    response
                }
            }).onGet();

            assert.strictEqual(result.location, PENALTY_DETAILS_PAGE_URI);
        });

        it('should redirect to last page user progressed to when user holds no navigation pass for page', async () => {
            const response = createSubstituteOf<Response>();

            const result = await createTestController({
                httpContext: {
                    request: {
                        url: '/summary',
                        session: new Session({
                            [SessionKey.ExtraData]: {
                                [APPLICATION_DATA_KEY]: {
                                    navigation: {
                                        permissions: ['/intro']
                                    }
                                } as Partial<ApplicationData>
                            }
                        })
                    },
                    response
                }
            }).onGet();

            assert.strictEqual(result.location, '/intro');
        });

        it('should render visited page when user holds navigation pass for page', () => {
            const response = createSubstituteOf<Response>(substitute => {
                substitute.status(Arg.any()).returns(substitute);
            });

            createTestController({
                httpContext: {
                    request: {
                        path: '/intro',
                        query: {},
                        session: new Session({
                            [SessionKey.ExtraData]: {
                                [APPLICATION_DATA_KEY]: {
                                    navigation: {
                                        permissions: ['/intro']
                                    }
                                } as Partial<ApplicationData>
                            }
                        })
                    },
                    response
                }
            }).onGet();

            response.received().status(StatusCodes.OK);
            // @ts-ignore
            response.received().render(response, template, Arg.any());
        });
    });

    describe('POST handler', () => {
        it('should store navigation pass for unique page that user is about to be redirected to', async () => {
            process.env.COOKIE_SECRET = 'super long and very secure secret';

            const sessionStore = createSubstituteOf<SessionStore>(substitute => {
                substitute.store(Arg.any(), Arg.any(), Arg.any()).resolves();
            });

            const container = new Container();
            container.load(buildProviderModule());
            container.bind(SessionStore).toConstantValue(sessionStore);

            const result = await createTestController({
                httpContext: {
                    container,
                    request: {
                        url: '/intro',
                        query: {},
                        cookies: {},
                        session: new Session({
                            [SessionKey.Id]: 'cookie-id',
                            [SessionKey.ExtraData]: {
                                [APPLICATION_DATA_KEY]: {
                                    navigation: {
                                        permissions: ['/intro']
                                    }
                                } as Partial<ApplicationData>
                            }
                        })
                    },
                    response: createSubstituteOf<Response>()
                }
            }).onPost();

            const sessionInstance = Substitute.for<ISession>();
            const cookie = {sessionId: '001', signature: 'BON', } as Cookie;
            const ttl = 2000;

            sessionStore.store(cookie, sessionInstance, ttl);
            assert.strictEqual(result.location, '/next');
            sessionStore.received().store(cookie, sessionInstance, ttl);
        });

        it('should not store navigation pass for already visited page that user is about to be redirected to', () => {
            const sessionStore = createSubstituteOf<SessionStore>(substitute => {
                substitute.store(Arg.any(), Arg.any(), Arg.any()).resolves();
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
                        session: new Session({
                            [SessionKey.ExtraData]: {
                                [APPLICATION_DATA_KEY]: {
                                    navigation: {
                                        permissions: ['/next']
                                    }
                                } as Partial<ApplicationData>
                            }
                        })
                    },
                    response: createSubstituteOf<Response>()
                }
            }).onPost();

            sessionStore.didNotReceive().store(Arg.any(), Arg.any());
        });

        it('should not store navigation pass when no redirect is about to be made', () => {
            // tslint:disable-next-line:max-classes-per-file
            class SadProcessor implements FormActionProcessor {
                process(): void | Promise<void> {
                    return Promise.reject(new Error(':('));
                }
            }

            const sessionStore = createSubstituteOf<SessionStore>(substitute => {
                substitute.store(Arg.any(), Arg.any(), Arg.any()).resolves();
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
                        session: new Session({})
                    },
                    response: createSubstituteOf<Response>()
                },
                processor: SadProcessor,
            }).onPost();

            sessionStore.didNotReceive().store(Arg.any(), Arg.any());
        });
    });
});
