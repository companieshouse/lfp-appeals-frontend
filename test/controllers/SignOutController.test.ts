import 'reflect-metadata';

import { Session } from 'ch-node-session-handler';
import { expect } from 'chai';
import { BAD_REQUEST, MOVED_TEMPORARILY, OK } from 'http-status-codes';
import request from 'supertest';

import { SIGNOUT_RETURN_URL_SESSION_KEY } from 'app/Constants';
import 'app/controllers/SignOutController';
import { ApplicationData } from 'app/models/ApplicationData';
import { YesNo } from 'app/models/fields/YesNo';
import { ACCOUNTS_SIGNOUT_URI, SIGNOUT_PAGE_URI } from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';
import { createSession } from 'test/utils/session/SessionFactory';



const pageHeading = 'Are you sure you want to sign out?';
const hint = 'Your answers will not be saved. You will need to start again if you want to appeal a penalty for filing your company accounts late.';
const errorSummaryHeading = 'There is a problem';


const navigation = { permissions: [SIGNOUT_PAGE_URI] };
const applicationData: Partial<ApplicationData> = {
    navigation
};

describe('SignOutController', () => {


    let app = createApp(applicationData);


    describe('on GET', () => {

        it('should return 200 response', async () => {
            await request(app).get(SIGNOUT_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.be.equal(OK);
                    expect(response.text).to.include(pageHeading)
                        .and.to.include(hint)
                        .and.not.include(errorSummaryHeading);
                });
        });

        it('should show radio buttons for do you want to sign out', async () => {
            await request(app).get(SIGNOUT_PAGE_URI).expect(response => {
                expect(response.text).to.include('type="radio"');
                expect(response.text).to.include('value="yes"');
                expect(response.text).to.include('value="no"');
                const radioCount = (response.text.match(/type="radio"/g) || []).length;
                expect(radioCount).to.equal(2);
            });
        });
   });


   describe('on POST', () => {

        it('should show an error if sign out option is not selected', async () => {

                let session: Session;
                app = createApp(applicationData, undefined, (_: Session) => {
                    const sess = createSession(process.env.COOKIE_SECRET as string);
                    session = sess;
                    session.setExtraData(SIGNOUT_RETURN_URL_SESSION_KEY, 'return url');
                     return sess;
                });

            await request(app).post(SIGNOUT_PAGE_URI)
                .expect(response => {
                    expect(response.status).to.equal(BAD_REQUEST);
                            expect(response.text).to.contain('Select yes if you want to sign out');
                });
        });

        it('should send the user to the front page of the CHS service', async () => {
            await request(app).post(SIGNOUT_PAGE_URI).send({ signingOut: YesNo.yes }).expect(res => {
                expect(res.status).to.equal(MOVED_TEMPORARILY);
                expect(res.header.location).to.include(ACCOUNTS_SIGNOUT_URI);
            });
        });

        it('should send the user to the user back to the previous page the user was on', async () => {
            let session: Session;
                app = createApp(applicationData, undefined, (_: Session) => {
                    const sess = createSession(process.env.COOKIE_SECRET as string);
                    session = sess;
                    session.setExtraData(SIGNOUT_RETURN_URL_SESSION_KEY, 'return url');
                     return sess;
            });

            await request(app).post(SIGNOUT_PAGE_URI).send({ signingOut: YesNo.no }).expect(res => {
                expect(res.status).to.equal(MOVED_TEMPORARILY);
                expect(session.getExtraData(SIGNOUT_RETURN_URL_SESSION_KEY)).to.include('return url');
            });
        });
    });
});
