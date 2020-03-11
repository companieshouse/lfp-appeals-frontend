import { Maybe, Session, SessionMiddleware } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators';
import { controller } from 'inversify-express-utils';

import { BaseController } from 'app/controllers/BaseController';
import { FormSubmissionProcessor } from 'app/controllers/processors/FormSubmissionProcessor';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { Appeal, APPEALS_KEY } from 'app/models/Appeal'
import { EmailService } from 'app/modules/email-publisher/EmailService'
import {
    CHECK_YOUR_APPEAL_PAGE_URI,
    CONFIRMATION_PAGE_URI,
    OTHER_REASON_PAGE_URI
} from 'app/utils/Paths';

const template = 'check-your-appeal';

const navigation = {
    previous(): string {
        return OTHER_REASON_PAGE_URI;
    },
    next(): string {
        return CONFIRMATION_PAGE_URI;
    }
};

@provide(UserEmailFormSubmissionProcessor)
class UserEmailFormSubmissionProcessor implements FormSubmissionProcessor {
    constructor(@inject(EmailService) private readonly emailService: EmailService) {}

    async process(req: Request): Promise<void> {
        const userProfile = req.session
            .chain(_ => _.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .map(info => info[SignInInfoKeys.UserProfile])
            .orDefault({});

        const appealsData = req.session
            .chain(_ => _.getExtraData())
            .chain(data => Maybe.fromNullable(data[APPEALS_KEY]))
            .orDefault({});

        await this.emailService.send({
            to: userProfile?.email as string,
            subject: 'Confirmation of your appeal - ' + appealsData.penaltyIdentifier.companyNumber + ' - Companies House',
            body: {
                templateName: 'lfp-appeal-submission-confirmation',
                templateData: {
                    companyNumber: appealsData.penaltyIdentifier.companyNumber,
                    userProfile: {
                        email: userProfile?.email
                    }
                }
            }
        });
    }
}

// tslint:disable-next-line: max-classes-per-file
@controller(CHECK_YOUR_APPEAL_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class CheckYourAppealController extends BaseController<any> {
    constructor () {
        super(template, navigation, undefined, undefined, [UserEmailFormSubmissionProcessor])
    }

    protected prepareViewModelFromSession(session: Session): Record<string, any> {
        const userProfile = session.getValue<ISignInInfo>(SessionKey.SignInInfo)
            .map(info => info[SignInInfoKeys.UserProfile])
            .orDefault({});

        return {
            ...super.prepareViewModelFromSession(session),
            userProfile
        };
    }

    protected prepareViewModelFromAppeal(appeal: Appeal): any {
        return appeal;
    }
}
