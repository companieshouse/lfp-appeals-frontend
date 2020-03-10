import { Maybe, SessionMiddleware } from 'ch-node-session-handler';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo, IUserProfile } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';
import { inject } from 'inversify'
import { controller, httpGet, httpPost } from 'inversify-express-utils';
import { HttpResponseMessage } from 'inversify-express-utils/dts/httpResponseMessage';

import { BaseAsyncHttpController } from 'app/controllers/BaseAsyncHttpController';
import { AuthMiddleware } from 'app/middleware/AuthMiddleware';
import { Appeal, APPEALS_KEY } from 'app/models/Appeal'
import { EmailService } from 'app/modules/email-publisher/EmailService'
import { CHECK_YOUR_APPEAL_PAGE_URI, CONFIRMATION_PAGE_URI } from 'app/utils/Paths';

@controller(CHECK_YOUR_APPEAL_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class CheckYourAppealController extends BaseAsyncHttpController {
    constructor (@inject(EmailService) private readonly emailService: EmailService) {
        super();
    }

    @httpGet('')
    public async renderView(req: Request): Promise<string> {
        const userProfile = req.session
            .chain(_ => _.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .map(info => info[SignInInfoKeys.UserProfile])
            .orDefault({});

        const appealsData = req.session
            .chain(_ => _.getExtraData())
            .chain(data => Maybe.fromNullable(data[APPEALS_KEY]))
            .orDefault({});

        return this.render('check-your-appeal', { ...appealsData, userProfile });
    }

    @httpPost('')
    public async handleFormSubmission(req: Request): Promise<HttpResponseMessage> {
        const userProfile = req.session
            .chain(_ => _.getValue<ISignInInfo>(SessionKey.SignInInfo))
            .map(info => info[SignInInfoKeys.UserProfile])
            .extract() as IUserProfile;

        const appealsData = req.session
            .chain(_ => _.getExtraData())
            .chain(data => Maybe.fromNullable(data[APPEALS_KEY]))
            .extract() as Appeal;

        const regionPrefix: string = appealsData.penaltyIdentifier.companyNumber.slice(0,2);
        let internalTeam = process.env.DEFAULT_TEAM_EMAIL;
        if (regionPrefix === 'SC') internalTeam = process.env.SC_TEAM_EMAIL;
        else if(regionPrefix === 'NI') internalTeam = process.env.NI_TEAM_EMAIL;

        // Send submission emails to internal team according to the prefix
        await this.emailService.send({
            to: internalTeam as string,
            subject: 'Appeal submitted - ' + appealsData.penaltyIdentifier.companyNumber,
            body: {
                templateName: 'lfp-appeal-submission-internal',
                templateData: {
                    companyNumber: appealsData.penaltyIdentifier.companyNumber,
                    userProfile: {
                        email: userProfile.email
                    },
                    reasons:{
                        other: {
                            title: appealsData.reasons.other.title,
                            description: appealsData.reasons.other.description
                        }
                    }
                }
            }
        });

        // Send submission confirmation email to user
        await this.emailService.send({
            to: userProfile.email as string,
            subject: 'Confirmation of your appeal - ' + appealsData.penaltyIdentifier.companyNumber + ' - Companies House',
            body: {
                templateName: 'lfp-appeal-submission-confirmation',
                templateData: {
                    companyNumber: appealsData.penaltyIdentifier.companyNumber,
                    userProfile: {
                        email: userProfile.email
                    }
                }
            }
        });

        return this.redirect(CONFIRMATION_PAGE_URI).executeAsync();
    }
}
