import { DateComponents } from './DateFormat';

export type Splitter = (_: string) => DateComponents;

export const E5DateSplitter: Splitter = (value: string) => {
    const splitDate = value.split('/');
    const year = splitDate[0];
    const month = splitDate[1];
    const day = splitDate[2];
    return {
        day,
        month,
        year,
        toString: () => `${year}/${month}/${day}`
    };
};

export const PenaltyDateSplitter: Splitter = (value: string) => {
    const splitDate = value.split(' ');
    const year = splitDate[2];
    const month = splitDate[1];
    const day = splitDate[0];
    return {
        day,
        month,
        year,
        toString: () => `${day} ${month} ${year}`
    };
};
