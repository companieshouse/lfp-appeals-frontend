import { Session } from '@companieshouse/node-session-handler';
import { expect } from 'chai';
import { NextFunction, Request, Response, } from 'express';

import { CommonVariablesMiddleware } from 'app/middleware/CommonVariablesMiddleware';

import { createSubstituteOf } from 'test/SubstituteFactory';

describe('Common Variables Middleware', () => {
    it('should populate the users email from the session', () => {
        const email = 'jblogs@example.com';
        const req: Request = { originalUrl: '', session: sessionWithEmail(email) } as Request;
        const res: Response = { locals: {} } as Response;
        const nextFunction = createSubstituteOf<NextFunction>();

        const commonVariablesMiddleware = new CommonVariablesMiddleware();

        commonVariablesMiddleware.handler(req, res, nextFunction);

        expect(res.locals.userEmail).to.deep.equal(email);
    });
});

function sessionWithEmail(email: string): Session {
    return {
        data: {
            signin_info: {
                user_profile: {
                    email
                }
            }
        }
    } as Session;
}