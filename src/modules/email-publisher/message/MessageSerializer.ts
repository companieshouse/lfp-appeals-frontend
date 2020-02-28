import * as avro from 'avsc'

import { Message } from './Message'

const type = avro.Type.forSchema({
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

export function serialize(message: Message): Buffer {
    return type.toBuffer(message);
}
