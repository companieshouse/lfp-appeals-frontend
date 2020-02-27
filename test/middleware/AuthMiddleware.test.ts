import 'reflect-metadata';
import '../../src/controllers/index';
import { expect } from 'chai';
import * as request from 'supertest';
import {
    OTHER_REASON_DISCLAIMER_PAGE_URI,
    OTHER_REASON_PAGE_URI,
    PENALTY_DETAILS_PAGE_URI,
    CONFIRMATION_PAGE_URI,
    CHECK_YOUR_APPEAL_PAGE_URI
} from '../../src/utils/Paths';
import { createApp, getDefaultConfig } from '../ApplicationFactory';
import { createFakeSession } from '../utils/session/FakeSessionFactory';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { generateSessionId, generateSignature } from 'ch-node-session-handler/lib/utils/CookieUtils';
import { PenaltyIdentifier } from '../../src/models/PenaltyIdentifier';
import Substitute, { Arg } from '@fluffy-spoon/substitute';
import { Request, Response, NextFunction } from 'express';
import { AuthMiddleware } from '../../src/middleware/AuthMiddleware';
import { Maybe } from 'ch-node-session-handler';

const config = getDefaultConfig();
const id = generateSessionId();
const sig = generateSignature(id, config.cookieSecret);

const session = createFakeSession(
    [{
        [SessionKey.Id]: id
    }, {
        [SessionKey.ClientSig]: sig
    }], config.cookieSecret, true);

const protectedPages = [
    PENALTY_DETAILS_PAGE_URI,
    OTHER_REASON_DISCLAIMER_PAGE_URI,
    OTHER_REASON_PAGE_URI,
    CONFIRMATION_PAGE_URI,
    CHECK_YOUR_APPEAL_PAGE_URI
];

describe('Authentication Middleware', () => {

    const authedApp = createApp(session);

    describe('Authed path', () => {

        const penaltyIdentifier: PenaltyIdentifier = {
            penaltyReference: 'A12345678',
            companyNumber: 'SC123123'
        };

        it('should not redirect the user to the sign in page if the user is signed in', async () => {

            for (const page of protectedPages) {
                await request(authedApp).post(page)
                    .expect(res => expect(res).to.not.equal(302));
            }

        });

        it('should call next if the user is signed in', () => {

            const mockRequest = {
                session: Maybe.of(session)
            } as Request;
            const mockResponse = Substitute.for<Response>();
            const mockNext = Substitute.for<NextFunction>();

            const authMiddleware = new AuthMiddleware().handler;

            authMiddleware(mockRequest, mockResponse, mockNext);

            //@ts-ignore
            mockResponse.didNotReceive().redirect(Arg.any());

        });
    });
    describe('no session scenario', () => {

        it('should not call next if the user is not signed in', () => {

            const unAuthedSession = createFakeSession([], config.cookieSecret, false);

            const mockRequest = {
                session: Maybe.of(unAuthedSession)
            } as Request;
            const mockResponse = Substitute.for<Response>();
            const mockNext = Substitute.for<NextFunction>();

            const authMiddleware = new AuthMiddleware().handler;

            authMiddleware(mockRequest, mockResponse, mockNext);

            //@ts-ignore
            mockResponse.received().redirect(Arg.any());

        });

        it('should redirect the user to sign in screen when trying to access protected pages', async () => {

            const appWithoutSession = createApp();

            for (const page of protectedPages) {
                await request(appWithoutSession).get(page)
                    .expect(302).then(res => expect(res.header.location).to.include('/signin'));
            }
        });

    });
});
