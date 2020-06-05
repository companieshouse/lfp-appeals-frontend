import { expect } from 'chai';

import { months, PenaltyDetailsDateAssertion } from 'app/models/dates/DateAsserter';
import { DateContent, DateFormat, E5DateContent, PenaltyItemContent } from 'app/models/dates/DateFormat';

describe('Date Converters', () => {
    it('should convert a string to an e5 date object', () => {
        const dateStrings = [
            '2020/05/12',
            '2020/12/31',
            '2020/01/02'
        ];

        dateStrings.forEach(date => {
            const e5DateContent = E5DateContent(date);
            expect(e5DateContent.toString()).to.equal(date);
        });

    });

    it('should convert a string to a penalty date object', () => {
        const dateStrings = [
            '12 May 2020',
            '31 December 2020',
            '1 January 2020',
        ];

        dateStrings.forEach(date => {
            const penaltyItemDate = PenaltyItemContent(date);
            expect(penaltyItemDate.toString()).to.equal(date);
        });
    });

    it('should throw an error if string is in wrong e5 date format', () => {
        const dateString = '2020a/05/12';
        expect(() => E5DateContent(dateString)).to.throw();
    });

    it('should convert an e5 date to penalty details date', () => {
        const e5DateFormat = new DateFormat(E5DateContent('2020/05/12'));
        const penaltyDetailsDate = e5DateFormat.map(_ =>
            new DateContent<'dd MM yyyy'>('dd MM yyyy',
                {
                    day: _.content.day,
                    month: months[Number(_.content.month) - 1],
                    year: _.content.year,
                    toString: () => `${_.content.day} ${months[Number(_.content.month) - 1]} ${_.content.year}`
                },
                PenaltyDetailsDateAssertion
            )
        );

        expect(penaltyDetailsDate.content.toString()).to.equal('12 May 2020');
    });

    it('should throw an error if the date is invalid when mapping to PenaltyItemDate');
    it('should convert a date in yyyy/mm/dd format to dd MM yyy format');
});