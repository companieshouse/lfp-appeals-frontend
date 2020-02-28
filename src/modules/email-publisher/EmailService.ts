import * as util from 'util'
import * as crypto from 'crypto'
import * as kafka from 'kafka-node'

import { Email } from './Email'
import { Message, type } from './message/Message'

export class EmailService {
    private readonly producer: kafka.Producer;

    constructor (private applicationIdentifier: string, kafkaClient: kafka.KafkaClient) {
        if (applicationIdentifier == null) {
            throw new Error('Application identifier is required')
        }
        if (kafkaClient == null) {
            throw new Error('Kafka client is required')
        }
        this.producer = new kafka.Producer(kafkaClient)
    }

    public async send(email: Email): Promise<void> {
        const message = this.createMessageFrom(email);
        return this.sendMessage(message);
    }

    private async sendMessage(message: Message): Promise<void> {
        const send = util.promisify(this.producer.send).bind(this.producer)
        return send([{
            topic: 'email-send',
            messages: [type.toBuffer(message)]
        }])
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