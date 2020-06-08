import { assertDateComponents, DateAssertion, E5DateAssertion, PenaltyDetailsDateAssertion } from './DateAsserter';
import { DateComponents, E5DateSplitter, PenaltyDateSplitter, Splitter } from './DateSplitters';

export type DateType = 'yyyy-mm-dd' | 'dd MM yyyy' | 'other';

export class DateContent<A = DateType> {
    public readonly content: DateComponents<A>;
    constructor(public readonly type: A, value: string, split: Splitter<A>, dateAssertion: DateAssertion<A>) {
        this.content = assertDateComponents<A>(dateAssertion)(split(value));
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
    new DateContent<'yyyy-mm-dd'>('yyyy-mm-dd', value, E5DateSplitter, E5DateAssertion);

export const PenaltyItemContent = (value: string) =>
    new DateContent<'dd MM yyyy'>('dd MM yyyy', value, PenaltyDateSplitter, PenaltyDetailsDateAssertion);

