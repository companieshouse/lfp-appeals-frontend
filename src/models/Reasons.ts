import { Illness } from 'app/models/Illness';
import { OtherReason } from 'app/models/OtherReason';

export interface Reasons {
  other: OtherReason;
  illness?: Illness;
}

