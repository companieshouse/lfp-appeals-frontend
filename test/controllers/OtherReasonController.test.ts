import 'reflect-metadata';
import * as request from 'supertest';
import { expect } from 'chai';
import { createApplication } from '../ApplicationFactory';

import '../../src/controllers/OtherReasonController';
import { OTHER_REASON_PAGE } from '../../src/utils/Paths';
import { RedisService } from '../../src/services/RedisService';
import { createSubstituteOf } from '../SubstituteFactory';

const pageHeading = 'Tell us why you’re appealing this penalty';
const errorSummaryHeading = 'There is a problem with the information you entered';
const invalidTitleErrorMessage = 'You must give your reason a title';
const invalidDescriptionErrorMessage = 'You must give us more information';

describe('OtherReasonController', () => {
    describe('GET request', () => {
        it('should return 200 response', async () => {
            const app = createApplication(container => {
                container.bind(RedisService).toConstantValue(createSubstituteOf<RedisService>(service => {
                    service.get('session::other-reason').returns(Promise.resolve('{}'))
                }))
            });
            await request(app).get(OTHER_REASON_PAGE)
                .expect(response => {
                    expect(response.status).to.be.equal(200);
                    expect(response.text).to.include(pageHeading)
                        .and.not.include(errorSummaryHeading);
                });
        });
    });

    describe('POST request', () => {
        it('should return 200 response with rendered error messages when invalid data was submitted', async () => {
            const app = createApplication(container => {
                container.bind(RedisService).toConstantValue(createSubstituteOf<RedisService>())
            });
            await request(app).post(OTHER_REASON_PAGE)
                .send({})
                .expect(response => {
                    expect(response.status).to.be.equal(200);
                    expect(response.text).to.include(pageHeading)
                        .and.to.include(errorSummaryHeading)
                        .and.to.include(invalidTitleErrorMessage)
                        .and.to.include(invalidDescriptionErrorMessage);
                });
        });

        it('should return 200 response with rendered data when valid data was submitted', async () => {
            const title = 'Some title';
            const description = 'Some description';

            const app = createApplication(container => {
                container.bind(RedisService).toConstantValue(createSubstituteOf<RedisService>(service => {
                    service.set('session::other-reason', JSON.stringify({ title, description })).returns(Promise.resolve())
                }))
            });
            await request(app).post(OTHER_REASON_PAGE)
                .send({ title, description })
                .expect(response => {
                    expect(response.status).to.be.equal(200);
                    expect(response.text).to.include(pageHeading)
                        .and.to.include(title)
                        .and.to.include(description)
                        .and.to.not.include(errorSummaryHeading)
                        .and.to.not.include(invalidTitleErrorMessage)
                        .and.to.not.include(invalidDescriptionErrorMessage);
                });
        });
    });
});
