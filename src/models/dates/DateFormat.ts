export type DateFormat<T> = { format: T, content: string };
export type Day = 'day';
export type Month = 'month';
export type Year = 'year';
export type Date = (_: Day) => (_: Month) => Year;

export type DateFormatType = 'yyyy/mm/dd' | 'dd MM yyyy';