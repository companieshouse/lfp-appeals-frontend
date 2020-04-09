import { Arg } from '@fluffy-spoon/substitute';
import { expect } from 'chai';

import { EmailService } from 'app/modules/email-publisher/EmailService';
import { type, Message } from 'app/modules/email-publisher/message/Message';
import { Payload, Producer } from 'app/modules/email-publisher/producer/Producer';

import { createSubstituteOf } from 'test/SubstituteFactory';

const applicationIdentifier = 'frontend';

describe('EmailService', () => {
    describe('instantiation', () => {
        it('should throw an error when application identifier is not defined', () => {
            [undefined, null].forEach(invalidApplicationIdentifier => {
                expect(() => new EmailService(invalidApplicationIdentifier as any, createSubstituteOf<Producer>()))
                    .to.throw('Application identifier is required');
            });
        });

        it('should throw an error when producer is not defined', () => {
            [undefined, null].forEach(kafkaProducer => {
                expect(() => new EmailService(applicationIdentifier, kafkaProducer as any))
                    .to.throw('Producer is required');
            });
        });
    });

    describe('sending emails', () => {
        it('should throw an error when message not defined', () => {
            const emailService = new EmailService(applicationIdentifier, createSubstituteOf<Producer>());

            [undefined, null].forEach(async invalidMessage => {
                try {
                    await emailService.send(invalidMessage as any);
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Email must be defined');
                }
            });
        });

        it('should produce right message to an email sending queue', async () => {
            const producer = createSubstituteOf<Producer>();
            const emailService = new EmailService(applicationIdentifier, producer);

            const email = {
                to: 'user@example.com',
                subject: 'Subject',
                body: {
                    templateName: 'template',
                    templateData: {
                        companyNumber: '12345678'
                    }
                }
            };
            await emailService.send(email);

            producer.received().send(Arg.is((payload: Payload) => {
                const deserializedMessage: Message = type.fromBuffer(payload.message);

                return payload.topic === 'email-send'
                    && deserializedMessage.app_id === applicationIdentifier
                    && deserializedMessage.message_type === email.body.templateName
                    && JSON.parse(deserializedMessage.data).to === email.to
                    && JSON.parse(deserializedMessage.data).subject === email.subject
                    && JSON.parse(deserializedMessage.data).companyNumber === email.body.templateData.companyNumber
                    && deserializedMessage.created_at != null;
            }));
        });
    });
});
