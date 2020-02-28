import { inject } from 'inversify'
import { controller, httpGet, httpPost } from 'inversify-express-utils';
import { CHECK_YOUR_APPEAL_PAGE_URI, CONFIRMATION_PAGE_URI } from '../utils/Paths';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo, IUserProfile } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { Maybe, SessionMiddleware } from 'ch-node-session-handler';
import { AppealKeys } from '../models/keys/AppealKeys';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';
import { HttpResponseMessage } from 'inversify-express-utils/dts/httpResponseMessage';

import { EmailService } from '../modules/email-publisher/EmailService'
import { Appeal } from '../models/Appeal'
import { PenaltyIdentifierKeys } from '../models/keys/PenaltyIdentifierKeys'

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
            .chain(data => Maybe.fromNullable(data[AppealKeys.APPEALS_KEY]))
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
            .chain(data => Maybe.fromNullable(data[AppealKeys.APPEALS_KEY]))
            .extract() as Appeal;

        try {
            await this.emailService.send({
                to: userProfile.email as string,
                subject: 'Your appeal has been submitted',
                body: {
                    templateName: 'lfp-appeal-submission-confirmation',
                    templateData: {
                        companyNumber: appealsData[AppealKeys.PENALTY_IDENTIFIER][PenaltyIdentifierKeys.COMPANY_NUMBER],
                        userProfile: {
                            email: userProfile.email
                        }
                    }
                }
            })
        } catch (err) {
            console.error(`Submission confirmation email was not sent due to: ${err}`);
        }

        return this.redirect(CONFIRMATION_PAGE_URI).executeAsync();
    }
}
