import { DateType } from './DateFormat';

export type DateComponents<T = DateType> = {
    type: T,
    day: string,
    month: string,
    year: string,
    toString: () => string;
};
export type Splitter<T = DateType> = (_: string) => DateComponents<T>;

export const E5DateSplitter: Splitter<'yyyy-mm-dd'> = (value: string) => {
    const splitDate = value.split('-');
    const year = splitDate[0];
    const month = splitDate[1];
    const day = splitDate[2];
    return {
        type: 'yyyy-mm-dd',
        day,
        month,
        year,
        toString: () => `${year}-${month}-${day}`
    };
};

export const PenaltyDateSplitter: Splitter<'dd MM yyyy'> = (value: string) => {
    const splitDate = value.split(' ');
    const year = splitDate[2];
    const month = splitDate[1];
    const day = splitDate[0];
    return {
        type: 'dd MM yyyy',
        day,
        month,
        year,
        toString: () => `${day} ${month} ${year}`
    };
};
