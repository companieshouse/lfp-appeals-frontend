import { Appeal } from 'app/models/Appeal';
import { Attachment } from 'app/models/Attachment';
import { CreatedBy } from 'app/models/CreateBy';
import { OtherReason } from 'app/models/OtherReason';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { Reasons } from 'app/models/Reasons';

export function createDefaultAttachments(): Attachment[] {
    return [
        {
            id: '123',
            name: 'some-file.jpeg',
            size: 1000,
            contentType: 'image/jpeg'
        },
        {
            id: '456',
            name: 'another-file.txt',
            contentType: 'text/plain',
            size: 200
        }
    ];

}

export function createDefaultPenaltyIdentifier(): PenaltyIdentifier {
    return {
        companyNumber: '00345567',
        penaltyReference: 'A00000001',
    };
}

export function createDefaultOther(attachments?: Attachment[]): OtherReason {
    return {
        title: 'I have reasons',
        description: 'They are legit',
        attachments
    };
}

export function createDefaultReasons(attachments?: Attachment[]): Reasons {
    return {
        other: createDefaultOther(attachments)
    };
}

export function createDefaultAppeal(attachments?: Attachment[], createdBy?: CreatedBy, id?: string): Appeal {
    return {
        penaltyIdentifier: createDefaultPenaltyIdentifier(),
        reasons: createDefaultReasons(attachments),
        createdBy,
        id
    };
}
