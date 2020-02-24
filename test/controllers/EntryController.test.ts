import 'reflect-metadata';
import '../../src/controllers/EntryController';
import {createApplication, setupFakeAuth} from '../ApplicationFactory';
import * as request from 'supertest';
import { MOVED_TEMPORARILY } from 'http-status-codes';
import { ENTRY_PAGE_URI, PENALTY_DETAILS_PAGE_URI } from '../../src/utils/Paths';
import { expect } from 'chai';
import '../global';
import { CookieConfig, SessionMiddleware, SessionStore } from 'ch-node-session';
import { Redis } from "ioredis";
import Substitute from "@fluffy-spoon/substitute";
import { RequestHandler } from "express";
import { returnEnvVarible } from "../../src/utils/ConfigLoader";


describe('EntryController', () => {

    describe('GET request', () => {
        it('should return 302 when trying to access the entry page', async () => {

            const app = createApplication(container => {

                const config: CookieConfig = {
                    cookieName: returnEnvVarible('COOKIE_NAME'),
                    cookieSecret: returnEnvVarible('COOKIE_SECRET')
                };

                const redis = Substitute.for<Redis>();
                const sessionStore = new SessionStore(redis);
                const sessionHandler = SessionMiddleware(config, sessionStore);
                setupFakeAuth(container);
                container.bind<RequestHandler>(SessionMiddleware).toConstantValue(sessionHandler);
                container.bind(SessionStore).toConstantValue(sessionStore);

            });

            await request(app).get(ENTRY_PAGE_URI).expect(response => {
                expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                expect(response.get('Location')).to.be.equal(PENALTY_DETAILS_PAGE_URI);
            });
        });
    });
});
