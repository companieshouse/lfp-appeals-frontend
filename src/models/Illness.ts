
import { IllPerson } from './fields/IllPerson';

import { Attachment } from 'app/models/Attachment';

export interface Illness {
    illPerson: IllPerson;
    otherPerson?: string;
    illnessStart: Date;
    continuedIllness: boolean;
    illnessEnd?: Date;
    illnessInformation: string;
    attachments?: Attachment[];
}
