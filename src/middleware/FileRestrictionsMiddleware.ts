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
import { Attachment } from 'app/models/Attachment';

const customErrorTemplate = 'error-custom';

@provide(FileRestrictionsMiddleware)
export class FileRestrictionsMiddleware extends BaseMiddleware {

    public handler(req: Request, res: Response, next: NextFunction): void {

        const session = req.session;

        const signInInfo: ISignInInfo =
            session.chain(_ => _.getValue<ISignInInfo>(SessionKey.SignInInfo))
                .ifNothing(() => loggerInstance().error(`${FileRestrictionsMiddleware.name} - Sign in info was expected in session but none found`))
                .unsafeCoerce();

        const appeal: Appeal = session.chain(_ => _.getExtraData())
            .chainNullable<ApplicationData>(extraData => extraData[APPLICATION_DATA_KEY])
            .chainNullable(appData => appData.appeal)
            .ifNothing(() => loggerInstance().error(`${FileRestrictionsMiddleware.name} - Appeal was expected in session but none found`))
            .unsafeCoerce();

        const userProfile: IUserProfile | undefined = signInInfo[SignInInfoKeys.UserProfile];

        if (!userProfile) {
            throw new Error(`${FileRestrictionsMiddleware.name} - User profile was expected in session but none found`);
        }
        const adminPermissionFlag: string | undefined = signInInfo[SignInInfoKeys.AdminPermissions];
        const fileId: string = req.params.fileId;

        const hasSufficientPermissions = () =>
            this.hasAdminPermissions(userProfile, adminPermissionFlag) ||
            this.hasUserPermissions(userProfile, appeal);

        if (hasSufficientPermissions() && this.getAttachment(appeal, fileId)) {
            return next();
        }

        loggerInstance()
            .error(`${FileRestrictionsMiddleware.name} - user=${userProfile.id} does not have permission to download file ${fileId}`);

        return this.renderForbiddenError(res);
    }

    private hasAdminPermissions(userProfile: IUserProfile, adminPermissionFlag: string | undefined): boolean {

        if (!adminPermissionFlag || adminPermissionFlag !== '1') {
            return false;
        }

        const permissions = userProfile[UserProfileKeys.Permissions];

        return permissions !== undefined &&
            permissions[AppealsPermissionKeys.download] === 1 &&
            permissions[AppealsPermissionKeys.view] === 1;
    }

    private hasUserPermissions(userProfile: IUserProfile, appeal: Appeal): boolean {

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

    private getAttachment(appeal: Appeal, fileId: string): Attachment | undefined {

        if (!fileId) {
            throw Error('File id must not be null');
        }

        const attachments: Attachment[] | undefined = appeal.reasons.other.attachments;
        return attachments && attachments.find(attachment => attachment.id === fileId);
    }
}