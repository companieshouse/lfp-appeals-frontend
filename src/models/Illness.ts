import { Attachment } from 'app/models/Attachment';
import { IllPerson } from 'app/models/fields/IllPerson';
import { YesNo } from 'app/models/fields/YesNo';

export interface Illness {
    illPerson: IllPerson;
    otherPerson?: string;
    illnessStart: string;
    continuedIllness: YesNo;
    illnessEnd?: string;
    attachments?: Attachment[];
}
