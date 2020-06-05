import { assertDateComponents, DateAssertion, E5DateAssertion, PenaltyDetailsDateAssertion } from './DateAsserter';
import { E5DateSplitter, PenaltyDateSplitter } from './DateSplitters';

export type DateType = 'yyyy/mm/dd' | 'dd MM yyyy' | 'other';

export type DateComponents = {
    day: string,
    month: string,
    year: string,
    toString: () => string;
};

export class DateContent<C = DateType> {
    public readonly content: DateComponents;
    constructor(public readonly type: C, value: DateComponents, dateAssertion: DateAssertion) {
        this.content = value;
        assertDateComponents(dateAssertion)(this.content);
    }
    public toString(): string {
        return this.content.toString();
    }
}

// tslint:disable-next-line: max-classes-per-file
export class DateFormat<A = DateType> {

    constructor(public readonly content: DateContent<A>) { }
    public map<B = DateType>(f: (_: DateContent<A>) => DateContent<B>): DateFormat<B> {
        return new DateFormat(f(this.content));
    }
}

export const E5DateContent = (value: string) =>
    new DateContent<'yyyy/mm/dd'>('yyyy/mm/dd', E5DateSplitter(value), E5DateAssertion);

export const PenaltyItemContent = (value: string) =>
    new DateContent<'dd MM yyyy'>('dd MM yyyy', PenaltyDateSplitter(value), PenaltyDetailsDateAssertion);

