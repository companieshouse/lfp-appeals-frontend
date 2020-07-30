
import { YesNo } from './fields/YesNo';

export interface Illness {
    illnessStart: string;
    continuedIllness: YesNo;
    illnessEnd?: string;
}
