import { expect } from 'chai';

import { Appeal } from 'app/models/Appeal';
import { AppealStorageService } from 'app/service/AppealStorageService'

const appeal: Appeal = {
    penaltyIdentifier: {
        companyNumber: '00345567',
        penaltyReference: 'A00000001',
    },
    reasons: {
        other: {
            title: 'I have reasons',
            description: 'they are legit'
        }
    }
};

describe('AppealStorageService', () => {

    describe('saving appeals', () => {

        it('should throw an error when token not defined', () => {
            const appealStorageService = new AppealStorageService();

            [undefined, null].forEach(async invalidToken => {
                try {
                    await appealStorageService.save(appeal, invalidToken as any)
                } catch (err) {
                    expect(err).to.be.instanceOf(Error)
                        .and.to.haveOwnProperty('message').equal('Token is missing')
                }
            })
        });
    })
})
