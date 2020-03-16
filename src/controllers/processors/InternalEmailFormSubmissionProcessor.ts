import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo, IUserProfile } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';

import { FormSubmissionProcessor } from 'app/controllers/processors/FormSubmissionProcessor';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPEALS_KEY } from 'app/models/ApplicationData';
import { Email } from 'app/modules/email-publisher/Email';
import { EmailService } from 'app/modules/email-publisher/EmailService';
import { getEnvOrDefault } from 'app/utils/EnvironmentUtils';
import { findRegionByCompanyNumber } from 'app/utils/RegionLookup';

function buildEmail(userProfile: IUserProfile, appeal: Appeal): Email {
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

@provide(InternalEmailFormSubmissionProcessor)
export class InternalEmailFormSubmissionProcessor implements FormSubmissionProcessor {
    constructor(@inject(EmailService) private readonly emailService: EmailService) {}

    async process(req: Request): Promise<void> {
        const userProfile = req.session
            .chain(_ => _.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .map(info => info[SignInInfoKeys.UserProfile])
            .unsafeCoerce() as IUserProfile;

        const appealExtraData: ApplicationData = req.session
            .chain(_ => _.getExtraData())
            .map(data => data[APPEALS_KEY] as ApplicationData)
            .unsafeCoerce();

        await this.emailService.send(buildEmail(userProfile as IUserProfile, appealExtraData.appeal));
    }
}
