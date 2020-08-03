import { expect } from 'chai';

import { dateToString } from 'app/utils/DateFormatter';

describe('DateFormatter', () => {

    it('should return YYYY-MM-DD format for a local date', () =>{

        const date: Date = new Date('2020-10-30T23:00:00.000');
        expect(dateToString(date)).to.equal('2020-10-30');

    });

    it('should return YYYY-MM-DD format for a UTC date', () =>{

        const date: Date = new Date('2020-10-30T23:00:00.000z');
        expect(dateToString(date)).to.equal('2020-10-30');

    });

    it('should return incremented month value [0-11] by one for correct string representation [1-12]', () =>{

        const date: Date = new Date();
        date.setDate(30);
        date.setMonth(10);
        date.setFullYear(2020);
        expect(dateToString(date)).to.equal('2020-11-30');

    });

    it('should return YYYY-0M-DD format for dates with single digit months', () =>{

        const date: Date = new Date();
        date.setDate(30);
        date.setMonth(4);
        date.setFullYear(2020);
        expect(dateToString(date)).to.equal('2020-05-30');

    });

    it('should return a padded day format for single digit days', () =>{

        const date: Date = new Date();
        date.setDate(3);
        date.setMonth(11);
        date.setFullYear(2020);
        expect(dateToString(date)).to.equal('2020-12-03');

    });
});
