import { Session } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
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

function buildEmail(userProfile: IUserProfile, appeal: Appeal): Email {
    return {
        to: userProfile.email as string,
        subject: `Confirmation of your appeal - ${appeal.penaltyIdentifier.companyNumber} - Companies House`,
        body: {
            templateName: 'lfp-appeal-submission-confirmation',
            templateData: {
                companyName: appeal.penaltyIdentifier.companyName,
                companyNumber: appeal.penaltyIdentifier.companyNumber,
                penaltyReference: appeal.penaltyIdentifier.penaltyReference,
                userProfile: {
                    email: userProfile.email
                }
            }
        }
    };
}

@provide(UserEmailFormActionProcessor)
export class UserEmailFormActionProcessor implements FormActionProcessor {
    constructor(@inject(EmailService) private readonly emailService: EmailService) { }

    async process(req: Request): Promise<void> {

        const session: Session | undefined = req.session;

        if (!session) {
            throw new Error('Session is undefined');
        }

        const signInInfo: ISignInInfo | undefined = session!.get<ISignInInfo>(SessionKey.SignInInfo);

        const userProfile: IUserProfile | undefined = signInInfo?.user_profile;

        const applicationData: ApplicationData = session!.getExtraData(APPLICATION_DATA_KEY) || {} as ApplicationData;

        const email: Email = buildEmail(userProfile!, applicationData.appeal);

        await this.emailService.send(email)
            .catch(_ => {
                loggerInstance().error(`${UserEmailFormActionProcessor.name} - process: email=${JSON.stringify(email)}, error=${_}`);
                throw _;
            });

    }
}
