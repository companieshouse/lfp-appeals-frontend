import { expect } from 'chai';

import { dateFilter } from 'app/modules/nunjucks/DateFilter';

describe('Date Filter', () => {
    it('should reformat a correctly-formatted datestring into the format dd Month yyyy', () => {
        const testInput = '2020-5-1';
        const result = dateFilter(testInput);

        expect(result).to.equal('1 May 2020');
    });

    it('should throw an error if a date component is missing', () => {
        const testInput = '2020-5';
        expect(() => dateFilter(testInput)).to.throw('Input should be an ISO-formatted date string');
    });

    it('should throw an error if a date component is invalid', () => {
        const testInput = '2020-20-1';
        expect(() => dateFilter(testInput)).to.throw('Input should be an ISO-formatted date string');
    });

    it('should throw an error if the input format is invalid', () => {
        const testInput = '2020-20-one';
        expect(() => dateFilter(testInput)).to.throw('Input should be an ISO-formatted date string');
    });
});