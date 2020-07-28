
import { IllPerson } from './fields/IllPerson';
import { YesNo } from './fields/YesNo';

import { Attachment } from 'app/models/Attachment';

export interface Illness {
    illPerson: IllPerson;
    otherPerson?: string;
    illnessStart: Date;
    continuedIllness: YesNo;
    illnessEnd?: Date;
    illnessInformation: string;
    attachments?: Attachment[];
}
