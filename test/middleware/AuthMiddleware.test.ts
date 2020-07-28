import 'reflect-metadata';

import Substitute, { Arg } from '@fluffy-spoon/substitute';
import { expect } from 'chai';
import { NextFunction, Request, Response } from 'express';
import request from 'supertest';

import 'app/controllers/index';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import {
    CHECK_YOUR_APPEAL_PAGE_URI,
    CONFIRMATION_PAGE_URI, ILLNESS_START_DATE_PAGE_URI,
    OTHER_REASON_DISCLAIMER_PAGE_URI,
    OTHER_REASON_PAGE_URI,
    PENALTY_DETAILS_PAGE_URI
} from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';
import { createSession } from 'test/utils/session/SessionFactory';

const protectedPages = [
    PENALTY_DETAILS_PAGE_URI,
    OTHER_REASON_DISCLAIMER_PAGE_URI,
    OTHER_REASON_PAGE_URI,
    CONFIRMATION_PAGE_URI,
    CHECK_YOUR_APPEAL_PAGE_URI,
    ILLNESS_START_DATE_PAGE_URI
];

describe('Authentication Middleware', () => {

    describe('Authed path', () => {
        it('should not redirect the user to the sign in page if the user is signed in', async () => {
            const authedApp = createApp({});

            for (const page of protectedPages) {
                await request(authedApp).post(page)
                    .expect(res => expect(res).to.not.equal(302));
            }

        });

        it('should call next if the user is signed in', () => {

            const mockRequest = {
                session: createSession('secret')
            } as Request;
            const mockResponse = Substitute.for<Response>();
            const mockNext = Substitute.for<NextFunction>();

            const authMiddleware = new AuthMiddleware().handler;

            authMiddleware(mockRequest, mockResponse, mockNext);

            // @ts-ignore
            mockResponse.didNotReceive().redirect(Arg.any());

        });
    });
    describe('no session scenario', () => {

        it('should not call next if the user is not signed in', () => {

            const unAuthedSession = createSession('secret', false);

            const mockRequest = {
                headers: {
                    host: 'localhost'
                },
                session: unAuthedSession
            } as Request;
            const mockResponse = Substitute.for<Response>();
            const mockNext = Substitute.for<NextFunction>();

            const authMiddleware = new AuthMiddleware().handler;

            authMiddleware(mockRequest, mockResponse, mockNext);

            // @ts-ignore
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
