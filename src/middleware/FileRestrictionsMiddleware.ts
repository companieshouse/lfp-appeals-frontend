import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { UserProfileKeys } from 'ch-node-session-handler/lib/session/keys/UserProfileKeys';
import { ISignInInfo, IUserProfile } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { NextFunction, Request, Response } from 'express';
import { FORBIDDEN } from 'http-status-codes';
import { BaseMiddleware } from 'inversify-express-utils';
import { loggerInstance } from './Logger';

import { Appeal } from 'app/models/Appeal';
import { AppealsPermissionKeys } from 'app/models/AppealPermissionKeys';
import { APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Attachment } from 'app/models/Attachment';

const customErrorTemplate = 'error-custom';

export class FileRestrictionsMiddleware extends BaseMiddleware {

    public handler(req: Request, res: Response, next: NextFunction): void {

        const session = req.session;

        const adminPermissionFlag = session.chain(_ => _.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .chainNullable(signInInfo => signInInfo[SignInInfoKeys.AdminPermissions])
            .extract();

        const userProfile: IUserProfile = session.chain(_ => _.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .chainNullable(signInInfo => signInInfo[SignInInfoKeys.UserProfile])
            .ifNothing(() => loggerInstance().error(`${FileRestrictionsMiddleware.name} - User profile was expected in session but none found`))
            .unsafeCoerce();

        const permissions = userProfile[UserProfileKeys.Permissions];

        if (adminPermissionFlag === '1') {
            if (permissions &&
                permissions[AppealsPermissionKeys.download] &&
                permissions[AppealsPermissionKeys.view]) {
                return next();
            }
            return this.renderForbiddenError(res);

        } else {

            const appeal: Appeal = session.chain(_ => _.getExtraData())
                .chainNullable(extraData => extraData[APPLICATION_DATA_KEY])
                .chainNullable(applicationData => applicationData.appeal)
                .ifNothing(() => loggerInstance().error(`${FileRestrictionsMiddleware.name} - Appeal was expected in session but none found`))
                .unsafeCoerce();

            const fileId = req.params.fileId;
            const attachement = this.getAttachmentFrom(appeal, fileId);

            if (!attachement) {
                return this.renderForbiddenError(res);
            }

            // User must be creating a new appeal.
            if (!appeal.createdBy) {
                return next();
            }

            // Appeal was loaded from API
            if (appeal.createdBy?._id !== userProfile.id) {

                return this.renderForbiddenError(res);
            }

        }

        return next();
    }

    private renderForbiddenError(res: Response): void {
        res.status(FORBIDDEN);
        res.render(customErrorTemplate, {
            heading: 'You are not authorised to download this document'
        });
    }

    private getAttachmentFrom(appeal: Appeal, fileId: string): Attachment | undefined {

        if (!fileId) {
            throw Error('File id must not be null');
        }

        if (appeal.reasons.other.attachments) {
            const attachment = appeal.reasons.other.attachments.find(attachement => attachement.id === fileId);
            return attachment;
        }
        return undefined;
    }
}