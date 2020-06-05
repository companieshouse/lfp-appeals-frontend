import { DateComponents } from './DateFormat';

export const months: string[] = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
];

export type DateAssertion = {
    assertYear: (year: string) => void,
    assertMonth: (month: string) => void,
    assertDay: (day: string) => void;
};

export type DateAsserter = (dateAssertions: DateAssertion) => (components: DateComponents) => void;
export const assertDateComponents: DateAsserter = (dateAssertions: DateAssertion) =>
    (components: DateComponents): void => {
        dateAssertions.assertDay(components.day);
        dateAssertions.assertMonth(components.month);
        dateAssertions.assertYear(components.year);
    };

const assertOrThrow = (predicate: () => boolean, message: string) => {
    if (!predicate()) {
        throw new Error(message);
    }
};

export const E5DateAssertion: DateAssertion = {
    assertYear: (year: string) => {
        try {
            const yearNumber = parseInt(year, 10);
            assertOrThrow(() => year.length === 4, 'Year should have 4 characters');
            assertOrThrow(() => yearNumber > 0, 'Year should be positive');
        } catch (err) {
            throw new Error(`Cannot parse year with value ${year}. Err: ${err}`);
        }
    },
    assertMonth: (month: string) => {
        try {
            const monthNumber = parseInt(month, 10);
            assertOrThrow(() => monthNumber > 0, 'Month should be higher than 0');
            assertOrThrow(() => monthNumber < 13, 'Month should be less than 13');
        } catch (err) {
            throw new Error(`Cannot parse month with value ${month}. Err: ${err}`);
        }
    },
    assertDay: (day: string) => {
        try {
            const dayNumber = parseInt(day, 10);
            assertOrThrow(() => dayNumber > 0, 'Day should be higher than 0');
            assertOrThrow(() => dayNumber < 32, 'Day should be less than 32');
        } catch (err) {
            throw new Error(`Cannot parse day with value ${day}. Err: ${err}`);
        }
    }
};

export const PenaltyDetailsDateAssertion: DateAssertion = {
    assertYear: E5DateAssertion.assertYear,
    assertMonth: (month: string) => {
        try {
            assertOrThrow(() => months.indexOf(month) !== -1, 'Month should have 2 characters');
        } catch (err) {
            throw new Error(`Cannot parse month with value ${month}. Err: ${err}`);
        }
    },
    assertDay: E5DateAssertion.assertDay
};
