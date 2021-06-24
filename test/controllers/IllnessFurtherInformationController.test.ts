import 'reflect-metadata';

import { expect } from 'chai';
import { MOVED_TEMPORARILY } from 'http-status-codes';
import request from 'supertest';

import 'app/controllers/IllnessFurtherInformationController';
import { FURTHER_INFORMATION_PAGE_URI } from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';

describe('IllnessFurtherInformationController', () => {

    describe('GET request', () => {
        it('should return 200 when trying to access illness further information page ', async () => {
            const app = createApp();
            await request(app).get(FURTHER_INFORMATION_PAGE_URI).expect(response => {
                expect(response.status).to.be.equal(MOVED_TEMPORARILY);
                expect(response.get('Location')).to.contain('signin');
            });
        });
    });
});