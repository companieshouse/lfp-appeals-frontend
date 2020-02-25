import 'reflect-metadata'

import { createApplication, setupFakeAuth } from '../ApplicationFactory';
import * as request from 'supertest'
import { createSubstituteOf } from '../SubstituteFactory';

import '../../src/controllers/PenaltyDetailsController';
import { MOVED_TEMPORARILY, OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { expect } from 'chai';
import { PenaltyIdentifier } from '../../src/models/PenaltyIdentifier';
import { PENALTY_DETAILS_PAGE_URI, OTHER_REASON_DISCLAIMER_PAGE_URI } from '../../src/utils/Paths'
import { SessionStore, SessionMiddleware, CookieConfig } from 'ch-node-session-handler';
import Substitute, { Arg } from '@fluffy-spoon/substitute';
import { wrapValue } from 'ch-node-session-handler/lib/utils/EitherAsyncUtils';
import { Redis } from 'ioredis';
import { RequestHandler } from 'express';

const pageHeading = 'What are the penalty details?';
const errorSummaryHeading = 'There is a problem with the information you entered';

const config: CookieConfig = {
    cookieName: '__SID',
    cookieSecret: 'S+CmgW/ivLEaiFTzm87a1cyH+ZbD81yukx8n7e/efzQ='
};
const app = createApplication(container => {

    const redis = Substitute.for<Redis>();
    const sessionStore = new SessionStore(redis);
    const sessionHandler = SessionMiddleware(config, sessionStore);
    setupFakeAuth(container);
    container.bind<RequestHandler>(SessionMiddleware).toConstantValue(sessionHandler);
    container.bind(SessionStore).toConstantValue(sessionStore);

});

describe('PenaltyDetailsController', () => {
    describe('GET request', () => {

        it('should return 200 when trying to access page without a session', async () => {
            await request(app).get(PENALTY_DETAILS_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.contain(pageHeading)
                        .and.not.contain(errorSummaryHeading);
                })
        });

        it('should return 200 when trying to access page with a session', async () => {
            const penaltyIdentifier: PenaltyIdentifier = {
                penaltyReference: 'A12345678',
                companyNumber: 'SC123123'
            };

            const app = createApplication(container => {
                container.bind(SessionStore).toConstantValue(createSubstituteOf<SessionStore>(service => {
                    service.load(Arg.any()).returns(wrapValue(penaltyDetails))
                }));
            });

            await request(app).get(PENALTY_DETAILS_PAGE_URI)
                .set('Cookie', ['penalty-cookie=1'])
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain(penaltyIdentifier.companyNumber)
                        .and.to.contain(penaltyIdentifier.penaltyReference)
                        .and.not.contain(errorSummaryHeading)
                })
        });
    });

    describe('POST request', () => {
        it('should return 302 and redirect to disclaimer page when posting valid penalty details', async () => {
            const penaltyIdentifier: PenaltyIdentifier = {
                penaltyReference: 'A12345678',
                companyNumber: 'SC123123'
            };

            const app = createApplication(container => {
<<<<<<< HEAD
                container.bind(RedisService).toConstantValue(createSubstituteOf<RedisService>(service => {
                    service.setObject('1', penaltyIdentifier).returns(Promise.resolve())
                }));
=======

                const redis = Substitute.for<Redis>();
                const sessionStore = new SessionStore(redis);
                const sessionHandler = SessionMiddleware(config, sessionStore);
                setupFakeAuth(container);
                container.bind<RequestHandler>(SessionMiddleware).toConstantValue(sessionHandler);
                container.bind(SessionStore).toConstantValue(sessionStore);

>>>>>>> refactor!: refactored controllers to use ch session module.
            });

            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(penaltyIdentifier)
                .expect(response => {
                    expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                    expect(response.get('Location')).to.be.equal(OTHER_REASON_DISCLAIMER_PAGE_URI);
                    expect(response.get('Set-Cookie')).to.contain('penalty-cookie=1; Path=/');
                });
        });

        it('should return 400 when posting empty penalty reference', async () => {
            const penaltyIdentifier: PenaltyIdentifier = {
                penaltyReference: '',
                companyNumber: 'SC123123'
            };

            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(penaltyIdentifier)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain('You must enter a penalty reference number');
                });
        });

        it('should return 400 when posting invalid penalty reference', async () => {
            const penaltyIdentifier: PenaltyIdentifier = {
                penaltyReference: '12345678',
                companyNumber: 'SC123123'
            };

            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(penaltyIdentifier)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain('You must enter your reference number exactly as shown on your penalty notice');
                });
        });

        it('should return 400 when posting empty company number', async () => {
            const penaltyIdentifier: PenaltyIdentifier = {
                penaltyReference: 'A12345678',
                companyNumber: ''
            };

            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(penaltyIdentifier)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain('You must enter a company number');
                });
        });

        it('should return 400 when posting invalid company number', async () => {
            const penaltyIdentifier: PenaltyIdentifier = {
                penaltyReference: 'A12345678',
                companyNumber: 'AB66666666'
            };

            await request(app).post(PENALTY_DETAILS_PAGE_URI)
                .send(penaltyIdentifier)
                .expect(response => {
                    expect(response.status).to.be.equal(UNPROCESSABLE_ENTITY);
                    expect(response.text).to.contain(pageHeading)
                        .and.to.contain('You must enter your full eight character company number');
                });
        });
    });
});
