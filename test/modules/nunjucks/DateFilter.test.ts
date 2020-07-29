import { expect } from 'chai';

import { dateFilter } from 'app/modules/nunjucks/DateFilter';

describe('Date Filter', () => {
    it('should reformat a correctly-formatted datestring into the format dd Month yyyy', () => {
        const testInput = '2020-05-01';
        const result = dateFilter(testInput);

        expect(result).to.equal('1 May 2020');
    });

    it('should throw an error if a date component is missing', () => {
        const testInput = '2020-05';
        expect(() => dateFilter(testInput)).to.throw('Input should be formatted as yyyy-MM-dd');
    });

    it('should throw an error if a date component is invalid', () => {
        const testInput = '2020-20-01';
        expect(() => dateFilter(testInput)).to.throw('Input should be formatted as yyyy-MM-dd');
    });

    it('should throw an error if the input format is invalid', () => {
        const testInput = '2020-05-one';
        expect(() => dateFilter(testInput)).to.throw('Input should be formatted as yyyy-MM-dd');
    });
});