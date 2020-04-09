import * as avro from 'avsc';

export const type = avro.Type.forSchema({
    type: 'record',
    name: 'message',
    fields: [
        { name: 'app_id', type: 'string' },
        { name: 'message_id', type: 'string' },
        { name: 'message_type', type: 'string' },
        { name: 'data', type: 'string' },
        { name: 'email_address', type: 'string', default: '' }, // default to ignore property which is never used
        { name: 'created_at', type: 'string' }
    ]
});

export interface Message {
    app_id: string;
    message_id: string;
    message_type: string;
    data: string;
    created_at: string;
}
