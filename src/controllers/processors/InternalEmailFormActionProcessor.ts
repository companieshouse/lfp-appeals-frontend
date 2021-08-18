import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { ISignInInfo, IUserProfile } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';
import { inject } from 'inversify';
import { provide } from 'inversify-binding-decorators';

import { FormActionProcessor } from 'app/controllers/processors/FormActionProcessor';
import { loggerInstance } from 'app/middleware/Logger';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { ReasonType } from 'app/models/fields/ReasonType';
import { Email } from 'app/modules/email-publisher/Email';
import { EmailService } from 'app/modules/email-publisher/EmailService';
import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';
import { findRegionByCompanyNumber } from 'app/utils/RegionLookup';
import {
    formatDate,
    getAttachmentsFromReasons,
    getIllPersonFromIllnessReason,
    getReasonType
} from 'app/utils/appeal/extra.data';

function buildEmailReasonContent(appeal: Appeal): any {
    const reasonType = getReasonType(appeal.reasons);
    const attachments = getAttachmentsFromReasons(appeal.reasons);
    const attachmentsContent = attachments?.map((attachment) => {
        return {
            name: attachment.name,
            url: `${attachment.url}&a=${appeal.id}`,
        };
    });

    if (reasonType === ReasonType.other) {
        return {
            [ReasonType.other]: {
                title: appeal.reasons.other!.title,
                description: appeal.reasons.other!.description,
                attachments: attachmentsContent,
            },
        };
    } else {
        return {
            [ReasonType.illness]: {
                name: appeal.createdBy!.name,
                illPerson: getIllPersonFromIllnessReason(appeal.reasons.illness!),
                illnessStart: formatDate(appeal.reasons.illness!.illnessStart),
                description: appeal.reasons.illness!.illnessImpactFurtherInformation,
                attachments: attachmentsContent,
            },
        };
    }
}

function buildEmail(userProfile: IUserProfile, appeal: Appeal): Email {
    const region = findRegionByCompanyNumber(appeal.penaltyIdentifier.companyNumber);
    return {
        to: getEnvOrThrow(`${region}_TEAM_EMAIL`),
        subject: `Appeal submitted - ${appeal.penaltyIdentifier.companyNumber}`,
        body: {
            templateName: 'lfp-appeal-submission-internal',
            templateData: {
                companyName: appeal.penaltyIdentifier.companyName,
                companyNumber: appeal.penaltyIdentifier.companyNumber,
                penaltyReference: appeal.penaltyIdentifier.penaltyReference,
                userProfile: {
                    email: userProfile.email
                },
                reasons: buildEmailReasonContent(appeal)
            }
        }
    };
}

@provide(InternalEmailFormActionProcessor)
export class InternalEmailFormActionProcessor implements FormActionProcessor {
    constructor(@inject(EmailService) private readonly emailService: EmailService) { }

    async process(req: Request): Promise<void> {

        if (!req.session) {
            throw new Error('Session is undefined');
        }

        const signInInfo: ISignInInfo | undefined = req.session!.get<ISignInInfo>(SessionKey.SignInInfo);

        const userProfile: IUserProfile | undefined = signInInfo?.user_profile;

        const applicationData: ApplicationData = req.session!
            .getExtraData(APPLICATION_DATA_KEY) || {} as ApplicationData;

        const email: Email = buildEmail(userProfile!, applicationData.appeal);

        await this.emailService.send(email)
            .catch(_ => {
                loggerInstance().error(`${InternalEmailFormActionProcessor.name} - process: email=${JSON.stringify(email)}, error=${_}`);
                throw _;
            });
    }
}
