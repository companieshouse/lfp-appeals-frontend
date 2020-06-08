import { expect } from 'chai';

import { E5DateContent, PenaltyItemContent } from 'app/models/dates/DateFormat';

describe('DateFormat', () => {
    it('should convert a string to an e5 date object', () => {
        const dateStrings = [
            '2020-05-12',
            '2020-12-31',
            '2020-01-02'
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
        const dateString = '2020a-05-12';
        expect(() => E5DateContent(dateString)).to.throw();
    });

    it('should throw an error if string is not in valid penalty item date', () => {
        const date = '12 May 2020s';
        expect(() => PenaltyItemContent(date)).to.throw();
    });

    it('should throw an error if string is not a valid date in penalty item format', () => {
        const dateStrings = [
            '12 Something 2020',
            '32 December 2020',
            '0 January 2020',
        ];

        dateStrings.forEach(date => {
            const createDate = () => PenaltyItemContent(date);
            expect(createDate).to.throw();
        });

    });

    it('should throw an error if string is not a valid date in e5 format', () => {
        const dateStrings = [
            '2020-13-12',
            '2020-12-32',
            '2020-01-0',
            '20200-01-01'
        ];

        dateStrings.forEach(date => {
            const createDate = () => E5DateContent(date);
            expect(createDate).to.throw();
        });

    });

});