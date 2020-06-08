import { months, PenaltyDetailsDateAssertion } from './DateAsserter';
import { DateContent } from './DateFormat';

export function fromE5DateToPenaltyItemDate(dateContent: DateContent<'yyyy-mm-dd'>): DateContent<'dd MM yyyy'> {
    return new DateContent<'dd MM yyyy'>('dd MM yyyy', dateContent.toString(),
        (_: string) => {
            return {
                type: 'dd MM yyyy',
                day: dateContent.content.day,
                month: months[Number(dateContent.content.month) - 1],
                year: dateContent.content.year,
                toString: () => `${dateContent.content.day} ${months[Number(dateContent.content.month) - 1]} ${dateContent.content.year}`
            };
        },
        PenaltyDetailsDateAssertion
    );
}
