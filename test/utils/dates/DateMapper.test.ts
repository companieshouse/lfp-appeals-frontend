import { expect } from 'chai';

import { PenaltyDetailsDateAssertion } from 'app/models/dates/DateAsserter';
import { DateContent, DateFormat, E5DateContent } from 'app/models/dates/DateFormat';
import { fromE5DateToPenaltyItemDate } from 'app/models/dates/DateMapper';

describe('Date Mapper', () => {
    it('should map an e5 date content to a penalty item date content', () => {
        const e5DateFormat = new DateFormat(E5DateContent('2020-05-12'));
        const penaltyDetailsDate = e5DateFormat.map(fromE5DateToPenaltyItemDate);

        expect(penaltyDetailsDate.content.toString()).to.equal('12 May 2020');
    });

    it('should throw an error when mapping function yields incorrect target format', () => {
        const e5DateFormat = new DateFormat(E5DateContent('2020-05-12'));
        const incorrectMapToPenaltyDate = () => e5DateFormat.map(content => {
            return new DateContent<'dd MM yyyy'>(
                'dd MM yyyy',
                content.toString(),
                (_: string) => {
                    return {
                        type: 'dd MM yyyy',
                        day: content.content.day,
                        month: content.content.month,
                        year: content.content.year
                    };
                },
                PenaltyDetailsDateAssertion);
        });

        expect(incorrectMapToPenaltyDate).to.throw();
    });
});