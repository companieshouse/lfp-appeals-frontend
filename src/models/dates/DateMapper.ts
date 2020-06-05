import { months, PenaltyDetailsDateAssertion } from './DateAsserter';
import { DateContent } from './DateFormat';

export const fromE5DateToPenaltyItemDate = (e5Date: DateContent<'yyyy/mm/dd'>) => {
        return new DateContent<'dd MM yyyy'>('dd MM yyyy',
        {
            day: e5Date.content.day,
            month: months[Number(e5Date.content.month) - 1],
            year: e5Date.content.year,
            toString: () => `${e5Date.content.day} ${months[Number(e5Date.content.month) - 1]} ${e5Date.content.year}`
        },
        PenaltyDetailsDateAssertion
    );
};
