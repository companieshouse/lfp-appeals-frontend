import { Appeal } from 'app/models/Appeal';
import { Attachment } from 'app/models/Attachment';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { Reasons } from 'app/models/Reasons';

export const DEFAULT_PENALTY_IDENTIFIER: Readonly<PenaltyIdentifier> = {
    companyNumber: '00345567',
    penaltyReference: 'A00000001',
};

export const DEFALT_REASONS: Readonly<Reasons> = {
    other: {
        title: 'I have reasons',
        description: 'They are legit'
    }
};

export const DEFAULT_ATTACHMENTS: Attachment[] = [
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

export const DEFALT_REASONS_WITH_ATTACHMENTS: Readonly<Reasons> = {
    other: {
        title: 'I have reasons',
        description: 'They are legit',
        attachments: DEFAULT_ATTACHMENTS
    }
};

export const APPEAL: Readonly<Appeal> = {
    penaltyIdentifier: DEFAULT_PENALTY_IDENTIFIER,
    reasons: DEFALT_REASONS
};

export const APPEAL_WITH_ATTACHMENTS: Readonly<Appeal> = {
    penaltyIdentifier: DEFAULT_PENALTY_IDENTIFIER,
    reasons: DEFALT_REASONS_WITH_ATTACHMENTS
};
