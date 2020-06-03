export type Penalty = {
    readonly madeUpToDate?: string;
    readonly relatedItems: PenaltyItem<PenaltyTypes>[];
};

export type LateFillingPenaltyType = 'penalty';
export type OtherType = 'other';

export type PenaltyTypes = LateFillingPenaltyType | OtherType;

export type PenaltyType<T = PenaltyTypes> = { type: T, title: string };

export type PenaltyItem<T = PenaltyTypes> = {
    readonly type: PenaltyType<T>;
    readonly amount: number;
    readonly date: string;
};