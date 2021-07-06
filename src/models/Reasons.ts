import { Illness } from 'app/models/Illness';
import { OtherReason } from 'app/models/OtherReason';

interface PenaltyIllnessReason { illness: Illness; other?: never; }
interface PenaltyOtherReason { illness?: never; other: OtherReason; }

export type Reasons =  PenaltyIllnessReason | PenaltyOtherReason;