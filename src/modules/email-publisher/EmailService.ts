import * as crypto from 'crypto';

import { Email } from 'app/modules/email-publisher/Email';
import { type, Message } from 'app/modules/email-publisher/message/Message';
import { Producer } from 'app/modules/email-publisher/producer/Producer';

export class EmailService {

    constructor (private readonly applicationIdentifier: string, private readonly producer: Producer) {
        if (applicationIdentifier == null) {
            throw new Error('Application identifier is required');
        }
        if (producer == null) {
            throw new Error('Producer is required');
        }
    }

    public async send(email: Email): Promise<void> {
        if (email == null) {
            throw new Error('Email must be defined');
        }
        const message = this.createMessageFrom(email);
        return this.sendMessage(message);
    }

    private async sendMessage(message: Message): Promise<void> {
        await this.producer.send({
            topic: 'email-send',
            message: type.toBuffer(message)
        });
    }

    private createMessageFrom(email: Email): Message {
        return {
            app_id: this.applicationIdentifier,
            message_id: `message-${crypto.randomBytes(16).toString('hex')}`,
            message_type: email.body.templateName,
            data: JSON.stringify({
                to: email.to,
                subject: email.subject,
                ...email.body.templateData
            }),
            created_at: new Date().toISOString()
        };
    }
}
