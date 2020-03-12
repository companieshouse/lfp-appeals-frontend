import { Maybe, Session, SessionMiddleware } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo, IUserProfile } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';
import { inject } from 'inversify'
import { provide } from 'inversify-binding-decorators';
import { controller } from 'inversify-express-utils';

import { BaseController } from 'app/controllers/BaseController';
import { FormSubmissionProcessor } from 'app/controllers/processors/FormSubmissionProcessor';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { Appeal, APPEALS_KEY } from 'app/models/Appeal'
import { Email } from 'app/modules/email-publisher/Email';
import { EmailService } from 'app/modules/email-publisher/EmailService'
import { getEnvOrDefault } from 'app/utils/EnvironmentUtils';
import {
    CHECK_YOUR_APPEAL_PAGE_URI,
    CONFIRMATION_PAGE_URI,
    OTHER_REASON_PAGE_URI
} from 'app/utils/Paths';
import { findRegionByCompanyNumber, Region } from 'app/utils/RegionLookup';

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

        await this.emailService.send(this.buildEmail(userProfile as IUserProfile, appealsData));
    }

    private buildEmail(userProfile: IUserProfile, appeal: Appeal): Email {
        return {
            to: userProfile?.email as string,
            subject: `Confirmation of your appeal - ${appeal.penaltyIdentifier.companyNumber} - Companies House`,
            body: {
                templateName: 'lfp-appeal-submission-confirmation',
                templateData: {
                    companyNumber: appeal.penaltyIdentifier.companyNumber,
                    userProfile: {
                        email: userProfile?.email
                    }
                }
            }
        };
    }
}

// tslint:disable-next-line:max-classes-per-file
@provide(InternalEmailFormSubmissionProcessor)
class InternalEmailFormSubmissionProcessor implements FormSubmissionProcessor {
    constructor(@inject(EmailService) private readonly emailService: EmailService) {}

    async process(req: Request): Promise<void> {
        const userProfile = req.session
            .chain(_ => _.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .map(info => info[SignInInfoKeys.UserProfile])
            .orDefault({});

        const appeal = req.session
            .chain(_ => _.getExtraData())
            .chain(data => Maybe.fromNullable(data[APPEALS_KEY]))
            .orDefault({});

        await this.emailService.send(this.buildEmail(userProfile as IUserProfile, appeal));
    }

    private buildEmail(userProfile: IUserProfile, appeal: Appeal): Email {
        const region = findRegionByCompanyNumber(appeal.penaltyIdentifier.companyNumber);
        return {
            to: getEnvOrDefault(`${region}_TEAM_EMAIL`),
            subject: `Appeal submitted - ${appeal.penaltyIdentifier.companyNumber}`,
            body: {
                templateName: 'lfp-appeal-submission-internal',
                templateData: {
                    companyNumber: appeal.penaltyIdentifier.companyNumber,
                    userProfile: {
                        email: userProfile.email
                    },
                    reasons: {
                        other: {
                            title: appeal.reasons.other.title,
                            description: appeal.reasons.other.description
                        }
                    }
                }
            }
        };
    }
}

// tslint:disable-next-line: max-classes-per-file
@controller(CHECK_YOUR_APPEAL_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class CheckYourAppealController extends BaseController<any> {
    constructor () {
        super(template, navigation, undefined, undefined,
            [InternalEmailFormSubmissionProcessor, UserEmailFormSubmissionProcessor]);
        // tslint:disable-next-line: forin
        for (const region in Region) {
            getEnvOrDefault(`${region}_TEAM_EMAIL`)
        }
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
