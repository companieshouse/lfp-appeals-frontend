// tslint:disable-next-line:max-classes-per-file
import { Maybe } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo, IUserProfile } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';

import { FormSubmissionProcessor } from 'app/controllers/processors/FormSubmissionProcessor';
import { Appeal, APPEALS_KEY } from 'app/models/Appeal';
import { Email } from 'app/modules/email-publisher/Email';
import { EmailService } from 'app/modules/email-publisher/EmailService';
import { getEnvOrDefault } from 'app/utils/EnvironmentUtils';
import { findRegionByCompanyNumber } from 'app/utils/RegionLookup';

@provide(InternalEmailFormSubmissionProcessor)
export class InternalEmailFormSubmissionProcessor implements FormSubmissionProcessor {
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
