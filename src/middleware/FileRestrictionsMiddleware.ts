import { Maybe } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { UserProfileKeys } from 'ch-node-session-handler/lib/session/keys/UserProfileKeys';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
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

        const mAppeal: Maybe<Appeal> = session.chain(_ => _.getExtraData())
            .chainNullable<ApplicationData>(extraData => extraData[APPLICATION_DATA_KEY])
            .chainNullable(appData => appData.appeal)
            .ifNothing(() => loggerInstance().error(`${FileRestrictionsMiddleware.name} - Appeal was expected in session but none found`));

        const fileId: string = req.params.fileId;

        const hasAdminPermissions: boolean = this.hasAdminPermissions(signInInfo);
        const hasUserPermissions: boolean = this.hasUserPermissions(fileId, signInInfo, mAppeal.unsafeCoerce());

        return hasAdminPermissions || hasUserPermissions ? next() : this.renderForbiddenError(res);
    }

    private hasAdminPermissions(signInInfo: ISignInInfo): boolean {

        const userProfile = signInInfo[SignInInfoKeys.UserProfile];

        if (!userProfile) {
            throw new Error(`${FileRestrictionsMiddleware.name} - User profile was expected in session but none found`);
        }

        const adminPermissionFlag: string | undefined = signInInfo[SignInInfoKeys.AdminPermissions];
        const permissions = userProfile[UserProfileKeys.Permissions];

        if (!adminPermissionFlag || adminPermissionFlag !== '1') {
            return false;
        }

        return permissions &&
            permissions[AppealsPermissionKeys.download] &&
            permissions[AppealsPermissionKeys.view];
    }

    private hasUserPermissions(fileId: string, signInInfo: ISignInInfo, appeal: Appeal): boolean {

        const userProfile = signInInfo[SignInInfoKeys.UserProfile];

        if (!userProfile) {
            throw new Error(`${FileRestrictionsMiddleware.name} - User profile was expected in session but none found`);
        }

        const attachment: Attachment | undefined = this.getAttachment(appeal, fileId);

        if (!attachment) {
            return false;
        }

        // User must be creating a new appeal.
        if (!appeal.createdBy) {
            return true;
        }

        // Appeal was loaded from API
        if (appeal.createdBy?._id !== userProfile.id) {
            return false;
        }

        return true;
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
        return attachments && attachments.find(attachement => attachement.id === fileId);

    }
}