import { expect } from 'chai';
import { MOVED_TEMPORARILY, OK } from 'http-status-codes';
import request from 'supertest';

import { Appeal } from 'app/models/Appeal';
import { ApplicationData } from 'app/models/ApplicationData';
import { ReasonType } from 'app/models/fields/ReasonType';
import { ILL_PERSON_PAGE_URI, OTHER_REASON_DISCLAIMER_PAGE_URI } from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';

describe('ReasonRouterMiddleware', () => {

    function generateApplicationData(currentReasonType?: ReasonType): ApplicationData {
        return {
            appeal: {
                penaltyIdentifier: {
                    companyNumber: 'NI000000',
                    penaltyReference: 'A00000001'
                },
                currentReasonType: currentReasonType ? currentReasonType: ReasonType.other
            } as Appeal,
            navigation: {
                permissions: [OTHER_REASON_DISCLAIMER_PAGE_URI]
            }
        };
    }

    it('should redirect the user to the first page of the Illness journey if Illness reason is selected', async () => {
        const app = createApp(generateApplicationData(ReasonType.illness));

        await request(app).get(OTHER_REASON_DISCLAIMER_PAGE_URI).expect(res => {
            expect(res.status).to.equal(MOVED_TEMPORARILY);
            expect(res.header.location).to.include(ILL_PERSON_PAGE_URI);
        });
    });

    it('should pass the user to the first page of the Other journey if Other reason is selected', async () => {
        const app = createApp(generateApplicationData(ReasonType.other));

        await request(app).get(OTHER_REASON_DISCLAIMER_PAGE_URI).expect(res => {
            expect(res.status).to.equal(OK);
            expect(res.text).to.include('Before you continue');
        });
    });
});
