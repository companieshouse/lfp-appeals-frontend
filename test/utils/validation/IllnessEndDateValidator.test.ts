import { assert, expect } from 'chai';
import { Request } from 'express';

import { IllnessEndDateValidator } from 'app/controllers/validators/IllnessEndDateValidator';
import { APPLICATION_DATA_UNDEFINED, SESSION_NOT_FOUND_ERROR } from 'app/utils/CommonErrors';

import { createSession } from 'test/utils/session/SessionFactory';

describe('IllnessEndDateValidator', () => {
    it('should throw an error if session is undefined', async () => {
        const illnessEndDateValidator = new IllnessEndDateValidator();
        try {
            await illnessEndDateValidator.validate({} as Request);
            assert.fail('Should have thrown an error');
        } catch (err) {
            expect(err.message).to.equal(SESSION_NOT_FOUND_ERROR.message);
        }
    });

    it('should throw an error if appData is undefined', async () => {
        const illnessEndDateValidator = new IllnessEndDateValidator();
        const session = createSession('secret', false);

        try {
            await illnessEndDateValidator.validate({ session } as Request);
            assert.fail('Should have thrown an error');
        } catch (err) {
            expect(err.message).to.equal(APPLICATION_DATA_UNDEFINED.message);
        }
    });
});
