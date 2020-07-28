
import { IllPerson } from './fields/IllPerson';

import { Attachment } from 'app/models/Attachment';

export interface Illness {
    illPerson: IllPerson;
    otherPerson?: string;
    illnessStart: string;
    continuedIllness: boolean;
    illnessEnd?: string;
    illnessInformation: string;
    attachments?: Attachment[];
}
