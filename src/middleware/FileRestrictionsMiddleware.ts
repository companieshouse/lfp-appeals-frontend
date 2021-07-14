import { Session } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { UserProfileKeys } from 'ch-node-session-handler/lib/session/keys/UserProfileKeys';
import { ISignInInfo, IUserProfile } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { NextFunction, Request, Response } from 'express';
import { FORBIDDEN } from 'http-status-codes';
import { provide } from 'inversify-binding-decorators';
import { BaseMiddleware } from 'inversify-express-utils';
import { loggerInstance } from './Logger';

import { Appeal } from 'app/models/Appeal';
import { AppealsPermissionKeys } from 'app/models/AppealsPermissionKeys';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { findAttachmentByIdFromReasons } from 'app/utils/appeal/extra.data';

const customErrorTemplate = 'error-custom';

@provide(FileRestrictionsMiddleware)
export class FileRestrictionsMiddleware extends BaseMiddleware {

    public handler(req: Request, res: Response, next: NextFunction): void {

        const session: Session | undefined = req.session;

        const signInInfo: ISignInInfo | undefined = session!.get<ISignInInfo>(SessionKey.SignInInfo);

        if (!signInInfo) {
            throw new Error('Sign in info was expected in session, but none found');
        }

        const applicationData: ApplicationData = session!.getExtraData(APPLICATION_DATA_KEY) || {} as ApplicationData;

        const appeal: Appeal = applicationData.appeal;

        if (!appeal) {
            throw new Error('Appeal was expected in session but none found');
        }

        const userProfile: IUserProfile | undefined = signInInfo![SignInInfoKeys.UserProfile];

        if (!userProfile) {
            throw new Error(`${FileRestrictionsMiddleware.name} - User profile was expected in session but none found`);
        }

        const fileId: string = req.params.fileId;

        if (!fileId) {
            throw Error('File id must not be null');
        }

        const hasSufficientPermissions = () =>
            this.hasAppealsPermissions(userProfile) ||
            this.hasUserPermission(userProfile, appeal);

        if (hasSufficientPermissions() && findAttachmentByIdFromReasons(appeal.reasons, fileId)) {
            return next();
        }

        loggerInstance()
            .error(`${FileRestrictionsMiddleware.name} - user=${userProfile.id} does not have permission to download file ${fileId}`);

        return this.renderForbiddenError(res);
    }

    private hasAppealsPermissions(userProfile: IUserProfile): boolean {

        const permissions = userProfile[UserProfileKeys.Permissions];

        return permissions !== undefined &&
            permissions[AppealsPermissionKeys.download] === 1 &&
            permissions[AppealsPermissionKeys.view] === 1;
    }

    private hasUserPermission(userProfile: IUserProfile, appeal: Appeal): boolean {

        // User must be creating a new appeal.
        if (!appeal.createdBy) {
            return true;
        }

        return appeal.createdBy?.id === userProfile.id;
    }

    private renderForbiddenError(res: Response): void {
        res.status(FORBIDDEN);
        res.render(customErrorTemplate, {
            heading: 'You are not authorised to download this document'
        });
    }
}
