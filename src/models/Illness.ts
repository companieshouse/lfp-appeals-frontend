import { Attachment } from 'app/models/Attachment';
import { IllPerson } from 'app/models/fields/IllPerson';

export interface Illness {
    illPerson: IllPerson;
    otherPerson?: string;
    illnessStart: string;
    continuedIllness: boolean;
    illnessEnd?: string;
    attachments?: Attachment[];
    illnessImpactFurtherInformation: string;
}
