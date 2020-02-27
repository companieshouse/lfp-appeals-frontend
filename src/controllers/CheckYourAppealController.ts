import { controller, httpGet, httpPost } from 'inversify-express-utils';
import { SUBMISSION_SUMMARY_PAGE_URI, CONFIRMATION_PAGE_URI } from '../utils/Paths';
import { SessionKey } from 'ch-node-session-handler/lib/session/keys/SessionKey';
import { SignInInfoKeys } from 'ch-node-session-handler/lib/session/keys/SignInInfoKeys';
import { ISignInInfo } from 'ch-node-session-handler/lib/session/model/SessionInterfaces';
import { Request } from 'express';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { SessionMiddleware, Maybe } from 'ch-node-session-handler';
import { AppealKeys } from '../models/keys/AppealKeys';
import { BaseAsyncHttpController } from './BaseAsyncHttpController';
import { HttpResponseMessage } from 'inversify-express-utils/dts/httpResponseMessage';

import * as kafka from 'kafka-node'
import * as util from 'util'

import * as avro from 'avsc'

@controller(SUBMISSION_SUMMARY_PAGE_URI, SessionMiddleware, AuthMiddleware)
export class CheckYourAppealController extends BaseAsyncHttpController {

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
        const client = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_BROKER_ADDR });
        const producer = new kafka.Producer(client);

        const type = avro.Type.forSchema({
            type: 'record',
            name: 'message',
            fields: [
                { name: 'app_id', type: 'string' },
                { name: 'message_id', type: 'string' },
                { name: 'message_type', type: 'string' },
                { name: 'data', type: 'string' },
                { name: 'email_address', type: 'string' },
                { name: 'created_at', type: 'string' }
            ]
        });

        await util.promisify(producer.send).bind(producer)([{
            topic: 'email-send',
            messages: [
                type.toBuffer({
                    app_id: 'lfp-appeals-frontend',
                    message_id: '5afdb299-d0a7-4a8e-a0ba-ed649ea56ad0',
                    message_type: 'lfp-appeal-submission-confirmation',
                    data: JSON.stringify({
                        to: 'demo@ch.gov.uk',
                        subject: 'Appeal submitted',
                        companyNumber: '12345678',
                        userProfile: {
                            email: 'demo@ch.gov.uk'
                        }
                    }),
                    email_address: 'demo@ch.gov.uk',
                    created_at: new Date().toISOString()
                })
            ]
        }]);

        return this.redirect(CONFIRMATION_PAGE_URI).executeAsync();
    }
}
