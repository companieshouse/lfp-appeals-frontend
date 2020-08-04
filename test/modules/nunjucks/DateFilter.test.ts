import { expect } from 'chai';

import { dateFilter } from 'app/modules/nunjucks/DateFilter';

describe('Date Filter', () => {
    it('should reformat a correctly-formatted datestring into the format dd Month yyyy', () => {
        const testCases = [
            { input: '1990-01-21', output: '21 January 1990' },
            { input: '2005-05-13', output: '13 May 2005' },
            { input: '2015-12-31', output: '31 December 2015' }
        ];

        testCases.forEach(testCase => {
            const result = dateFilter(testCase.input);
            expect(result).to.equal(testCase.output);
        });
    });

    it('should throw an error if a date component is missing', () => {
        const testInput = '2020-05';
        expect(() => dateFilter(testInput)).to.throw('Input should be formatted as yyyy-MM-dd');
    });

    it('should throw an error if a date component is invalid', () => {
        const testInput = '2020-20-01';
        expect(() => dateFilter(testInput)).to.throw('Input contains invalid month: 2020-20-01');
    });

    it('should throw an error if the input format is invalid', () => {
        const testInput = '2020-05-one';
        expect(() => dateFilter(testInput)).to.throw('Input should be formatted as yyyy-MM-dd');
    });
});