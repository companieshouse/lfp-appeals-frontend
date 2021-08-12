import 'reflect-metadata';

import { assert, expect } from 'chai';

import { RequestWithNavigation } from 'app/controllers/SafeNavigationBaseController';
import { NavigationPermissionProcessor } from 'app/controllers/processors/NavigationPermissionProcessor';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Navigation } from 'app/models/Navigation';
import { APPLICATION_DATA_UNDEFINED, SESSION_NOT_FOUND_ERROR } from 'app/utils/CommonErrors';
import { EVIDENCE_UPLOAD_PAGE_URI } from 'app/utils/Paths';

import { createSession } from 'test/utils/session/SessionFactory';

describe('NavigationPermissionProcessor', () => {

    const processor = new NavigationPermissionProcessor();
    const navigation: Navigation = { permissions: [] };
    const applicationData = {appeal: {}, navigation} as ApplicationData;

    it('should throw error when session does not exist', async () => {
        try {
            await processor.process({session: undefined} as RequestWithNavigation);
            assert.fail('Expected to throw error');
        } catch (err) {
            expect(err.message).to.equal(SESSION_NOT_FOUND_ERROR.message);
        }
    });

    it('should throw error when ApplicationData does not exist', async () => {
        try {
            const session = createSession('secret', true);
            await processor.process({session} as RequestWithNavigation);
            assert.fail('Expected to throw error');
        } catch (err) {
            expect(err.message).to.equal(APPLICATION_DATA_UNDEFINED.message);
        }
    });

    it('should update navigation permission with a new page - EVIDENCE_UPLOAD_PAGE_URI', async () => {
        const session = createSession('secret', true);
        session.setExtraData(APPLICATION_DATA_KEY, applicationData);

        await processor.process({session} as RequestWithNavigation);
        expect(applicationData.navigation.permissions).to.deep.equal([EVIDENCE_UPLOAD_PAGE_URI]);
    });
});
