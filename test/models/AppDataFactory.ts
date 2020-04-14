import { Appeal } from 'app/models/Appeal';
import { ApplicationData } from 'app/models/ApplicationData';
import { Attachment } from 'app/models/Attachment';
import { Navigation } from 'app/models/Navigation';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { Reasons } from 'app/models/Reasons';


export const DEFAULT_PENALTY_IDENTIFIER: PenaltyIdentifier = {
    companyNumber: '00345567',
    penaltyReference: 'A00000001',
};

export const DEFALT_REASONS: Reasons = {
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

export const DEFALT_REASONS_WITH_ATTACHMENTS: Reasons = {
    other: {
        title: 'I have reasons',
        description: 'They are legit',
        attachments: DEFAULT_ATTACHMENTS
    }
};

export const createAppData =
    (appeal: Partial<Appeal>, navigation?: Navigation): Partial<ApplicationData> => {
        return {
            appeal: {
                penaltyIdentifier: appeal.penaltyIdentifier ? appeal.penaltyIdentifier : DEFAULT_PENALTY_IDENTIFIER,
                reasons: appeal.reasons ? appeal.reasons : DEFALT_REASONS
            },
            navigation
        };
    };

export const createDefaultAppDataWithAttachents = (navigation?: Navigation): Partial<ApplicationData> => {
    return {
        appeal: {
            penaltyIdentifier: DEFAULT_PENALTY_IDENTIFIER,
            reasons: DEFALT_REASONS_WITH_ATTACHMENTS
        },
        navigation
    };
};

export const createDefaultAppData = (navigation?: Navigation): Partial<ApplicationData> => {
    return {
        appeal: {
            penaltyIdentifier: DEFAULT_PENALTY_IDENTIFIER,
            reasons: DEFALT_REASONS
        },
        navigation
    };
};