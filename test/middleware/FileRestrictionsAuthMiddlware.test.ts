import 'reflect-metadata';

import { expect } from 'chai';
import request from 'supertest';

import { DOWNLOAD_FILE_PAGE_URI } from 'app/utils/Paths';

import { createApp } from 'test/ApplicationFactory';

describe('FileRestrictionsAuthMiddleware', () => {

    const fileId = '123';
    const appealId = 'abc123';
    const companyNumber = 'NI000000';
    const pages = [
        `${DOWNLOAD_FILE_PAGE_URI}/prompt/${fileId}?a=${appealId}&c=${companyNumber}`,
        `${DOWNLOAD_FILE_PAGE_URI}/data/${fileId}/download?a=${appealId}&c=${companyNumber}`,
    ];

    it('should redirect the user to the signin screen if not authenticated', async () => {
        const appWithoutSession = createApp();
        for (const page of pages) {
            await request(appWithoutSession).get(page)
                .expect(302)
                .then(res => {
                    console.log(res.header);
                    expect(res.header.location)
                        .to.include('/signin')
                        .and.to.include(`${encodeURIComponent(page)}`);
                }
                );
        }
    });
});
