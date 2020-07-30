import { Illness } from 'app/models/Illness';
import { OtherReason } from 'app/models/OtherReason';

export interface Reasons {
  illness?: Illness;
  other: OtherReason;
}

