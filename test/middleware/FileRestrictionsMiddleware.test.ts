import 'reflect-metadata';

import { Maybe } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { expect } from 'chai';
import { NextFunction, Request, Response } from 'express';
import { FORBIDDEN } from 'http-status-codes';
import { createSubstituteOf } from '../SubstituteFactory';
import {
    createDefaultAppeal,
    createDefaultAttachments
} from '../models/AppDataFactory';
import { createSession } from '../utils/session/SessionFactory';

import { FileRestrictionsMiddleware } from 'app/middleware/FileRestrictionsMiddleware';
import { Appeal } from 'app/models/Appeal';
import { AppealsPermissionKeys } from 'app/models/AppealPermissionKeys';
import { ApplicationData } from 'app/models/ApplicationData';

describe('FileRestrictionsMiddleware', () => {

    const userId = 'someUserId';

    const DEFAULT_ATTACHMENTS = createDefaultAttachments();

    const getRequestSubsitute = (
        params: any,
        admin: boolean,
        data?: Partial<ApplicationData>,
        permissions?: any): Request => {

        const session = createSession('secret', true, admin, permissions);
        session.data[SessionKey.ExtraData] = {
            appeals: { ...data } || undefined
        };

        session.data[SessionKey.SignInInfo]![SignInInfoKeys.UserProfile]!.id = userId;

        return {
            session: Maybe.of(session),
            params
        } as Request;
    };

    const isAdmin = true;

    describe('As a CH Internal User session', () => {

        const appData: Partial<ApplicationData> = { appeal: createDefaultAppeal(DEFAULT_ATTACHMENTS) };
        const fileRestrictionsMiddleware = new FileRestrictionsMiddleware();

        it('should call next if the correct permissions are present in the session', () => {

            const request = getRequestSubsitute(
                { fileId: DEFAULT_ATTACHMENTS[0].id },
                isAdmin,
                appData,
                { [AppealsPermissionKeys.download]: 1, [AppealsPermissionKeys.view]: 1 }
            );

            const response = createSubstituteOf<Response>();
            const next = createSubstituteOf<NextFunction>();

            fileRestrictionsMiddleware.handler(request, response, next);
            next.received();
            response.didNotReceive();

        });

        it('should redirect to an error page if user does not have the correct permissions', () => {

            const requestNoPermissions = getRequestSubsitute({ fileId: DEFAULT_ATTACHMENTS[0].id }, isAdmin, appData);
            console.log(requestNoPermissions.session.__value.data.signin_info?.user_profile);
            const requestInvalidPermissions = getRequestSubsitute(
                { fileId: DEFAULT_ATTACHMENTS[0].id },
                true,
                appData,
                { '/some-permission/not-appeals': 1 }
            );

            let response = createSubstituteOf<Response>();
            let next = createSubstituteOf<NextFunction>();

            fileRestrictionsMiddleware.handler(requestNoPermissions, response, next);
            response.received().status(FORBIDDEN);
            response.received().render('error-custom', {
                heading: 'You are not authorised to download this document'
            });
            next.didNotReceive();

            response = createSubstituteOf<Response>();
            next = createSubstituteOf<NextFunction>();

            fileRestrictionsMiddleware.handler(requestInvalidPermissions, response, next);
            response.received().status(FORBIDDEN);
            response.received().render('error-custom', {
                heading: 'You are not authorised to download this document'
            });
            next.didNotReceive();

        });

    });

    describe('External User', () => {

        const getSubmittedAppeal = (): Appeal => {
            const { penaltyIdentifier, reasons } = createDefaultAppeal(DEFAULT_ATTACHMENTS);
            return {
                penaltyIdentifier,
                reasons,
                createdBy: { _id: userId }
            };
        };

        const fileRestrictionsMiddleware = new FileRestrictionsMiddleware();

        describe('Appeal is loaded via API', () => {

            it('file id is in attachments', () => {

                const appData: Partial<ApplicationData> = { appeal: getSubmittedAppeal() };

                const request = getRequestSubsitute(
                    { fileId: DEFAULT_ATTACHMENTS[0].id },
                    !isAdmin,
                    appData
                );

                const response = createSubstituteOf<Response>();
                const next = createSubstituteOf<NextFunction>();

                fileRestrictionsMiddleware.handler(request, response, next);
                next.received();
                response.didNotReceive().status(FORBIDDEN);
            });

            it('should redirect to error page if file id is not in appeal attachements', () => {

                const appData: Partial<ApplicationData> = { appeal: getSubmittedAppeal() };

                const request = getRequestSubsitute(
                    { fileId: 'somethingTotallyWrong' },
                    !isAdmin,
                    appData
                );

                const response = createSubstituteOf<Response>();
                const next = createSubstituteOf<NextFunction>();

                fileRestrictionsMiddleware.handler(request, response, next);
                response.received().status(FORBIDDEN);
                response.received().render('error-custom', {
                    heading: 'You are not authorised to download this document'
                });
                next.didNotReceive();
            });

            it('should redirect to error page if user tries to access appeal not created by the same user', () => {

                const appData: Partial<ApplicationData> = { appeal: getSubmittedAppeal() };
                appData.appeal!.createdBy! = { _id: 'SomeoneElse' };

                const request = getRequestSubsitute(
                    { fileId: DEFAULT_ATTACHMENTS[0].id },
                    !isAdmin,
                    appData
                );

                const response = createSubstituteOf<Response>();
                const next = createSubstituteOf<NextFunction>();

                fileRestrictionsMiddleware.handler(request, response, next);
                response.received().status(FORBIDDEN);
                response.received().render('error-custom', {
                    heading: 'You are not authorised to download this document'
                });
                next.didNotReceive();
            });

        });

        describe('User still has not submitted the appeal', () => {

            const getWorkInProgressAppeal = (): Appeal => {
                const { penaltyIdentifier, reasons } = createDefaultAppeal(DEFAULT_ATTACHMENTS);
                return {
                    penaltyIdentifier,
                    reasons
                };
            };

            it('should call next if user has not yet submitted the appeal and fileId is in the attachements', () => {
                const appData: Partial<ApplicationData> = { appeal: getWorkInProgressAppeal() };

                console.log(appData.appeal!.createdBy);

                const request = getRequestSubsitute(
                    { fileId: DEFAULT_ATTACHMENTS[0].id },
                    !isAdmin,
                    appData
                );

                const response = createSubstituteOf<Response>();
                const next = createSubstituteOf<NextFunction>();

                fileRestrictionsMiddleware.handler(request, response, next);
                next.received();
                response.didNotReceive().status(FORBIDDEN);
            });

            it('should redirect to error page when the user tries to access a fileId not in the attachements', () => {
                const appData: Partial<ApplicationData> = { appeal: getWorkInProgressAppeal() };

                const request = getRequestSubsitute(
                    { fileId: 'somethingTotallyWrong' },
                    !isAdmin,
                    appData
                );

                const response = createSubstituteOf<Response>();
                const next = createSubstituteOf<NextFunction>();

                fileRestrictionsMiddleware.handler(request, response, next);
                response.received().status(FORBIDDEN);
                response.received().render('error-custom', {
                    heading: 'You are not authorised to download this document'
                });
                next.didNotReceive();
            });

        });

    });
    describe('Exceptional use cases', () => {

        const fileRestrictionsMiddleware = new FileRestrictionsMiddleware();

        it('should throw an error when an appeal object is not in session', () => {

            const session = createSession('secret', true, false);
            session.data[SessionKey.ExtraData] = {
                appeals: { appeal: undefined }
            };

            session.data[SessionKey.SignInInfo]![SignInInfoKeys.UserProfile]!.id = userId;

            const request: Request = {
                session: Maybe.of(session),
                params: { fileId: DEFAULT_ATTACHMENTS[0].id }
            } as any;

            const response = createSubstituteOf<Response>();
            const next = createSubstituteOf<NextFunction>();
            expect(() => fileRestrictionsMiddleware.handler(request, response, next)).to.throw();
            next.didNotReceive();
            response.didNotReceive();

        });
        it('should throw an error when the profile is missing in session', () => {
            const session = createSession('secret', true, false);
            session.data[SessionKey.ExtraData] = {
                appeals: { appeal: createDefaultAppeal(DEFAULT_ATTACHMENTS) }
            };
            delete session.data[SessionKey.SignInInfo]![SignInInfoKeys.UserProfile];

            const request: Request = {
                session: Maybe.of(session),
                params: { fileId: DEFAULT_ATTACHMENTS[0].id }
            } as any;

            const response = createSubstituteOf<Response>();
            const next = createSubstituteOf<NextFunction>();
            expect(() => fileRestrictionsMiddleware.handler(request, response, next)).to.throw();
            next.didNotReceive();
            response.didNotReceive();
        });
    });

});