import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo, IUserProfile } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';

import { FormActionProcessor } from 'app/controllers/processors/FormActionProcessor';
import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Email } from 'app/modules/email-publisher/Email';
import { EmailService } from 'app/modules/email-publisher/EmailService';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';
import { DOWNLOAD_FILE_PAGE_URI } from 'app/utils/Paths';
import { findRegionByCompanyNumber } from 'app/utils/RegionLookup';
import { newUriFactory } from 'app/utils/UriFactory';

function buildEmail (userProfile: IUserProfile, appeal: Appeal, baseURI: string): Email {
    const region = findRegionByCompanyNumber(appeal.penaltyIdentifier.companyNumber);
    return {
        to: getEnvOrThrow(`${region}_TEAM_EMAIL`),
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
                        description: appeal.reasons.other.description,
                        attachments: appeal.reasons.other.attachments?.map(attachment => {
                            return {
                                name: attachment.name,
                                url: `${baseURI}/data/${attachment.id}/download?a=${appeal.id}&c=${appeal.penaltyIdentifier.companyNumber}`
                            };
                        })
                    }
                }
            }
        }
    };
}

@provide(InternalEmailFormActionProcessor)
export class InternalEmailFormActionProcessor implements FormActionProcessor {
    constructor(@inject(EmailService) private readonly emailService: EmailService) { }

    async process(req: Request): Promise<void> {
        const userProfile = req.session
            .chain(_ => _.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .map(info => info[SignInInfoKeys.UserProfile])
            .unsafeCoerce() as IUserProfile;

        const applicationData: ApplicationData = req.session
            .chain(_ => _.getExtraData())
            .map(data => data[APPLICATION_DATA_KEY] as ApplicationData)
            .unsafeCoerce();

        const email = buildEmail(userProfile, applicationData.appeal, newUriFactory(req)
            .createAbsoluteUri(DOWNLOAD_FILE_PAGE_URI));

        await this.emailService.send(email)
            .catch(_ => {
                loggerInstance().error(`${InternalEmailFormActionProcessor.name} - process: email=${JSON.stringify(email)}, error=${_}`);
                throw _;
            });
    }
}
