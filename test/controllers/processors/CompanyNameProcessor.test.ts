import 'reflect-metadata';

import Substitute, { Arg } from '@fluffy-spoon/substitute';
import ApiClient from 'ch-sdk-node/dist/client';
import CompanyProfileService from 'ch-sdk-node/dist/services/company-profile/service';
import { CompanyProfile } from 'ch-sdk-node/dist/services/company-profile/types';
import { assert, expect } from 'chai';
import { Request } from 'express';

import {
    CompanyNameProcessor,
    COMPANY_NAME_RETRIEVAL_ERROR,
    COMPANY_NUMBER_UNDEFINED_ERROR,
} from 'app/controllers/processors/CompanyNameProcessor';
import { AuthMethod, CompaniesHouseSDK } from 'app/modules/Types';
import { SESSION_NOT_FOUND_ERROR, TOKEN_MISSING_ERROR } from 'app/utils/CommonErrors';

import { createSubstituteOf } from 'test/SubstituteFactory';
import { createSession } from 'test/utils/session/SessionFactory';

describe('CompanyNameProcessor', () => {

    it('should throw an error if session is not found', async () => {

        const companyNameProcessor = new CompanyNameProcessor(Substitute.for<CompaniesHouseSDK>());
        const request = {} as Request;

        try {
            await companyNameProcessor.process(request);
            assert.fail('Expected to throw error');
        } catch (err) {
            expect(err.message).to.equal(SESSION_NOT_FOUND_ERROR.message);
        }

    });
    it('should throw an error if access token is missing from session', async () => {

        const companyNameProcessor = new CompanyNameProcessor(Substitute.for<CompaniesHouseSDK>());
        const session = createSession('secret', true);
        delete session.data.signin_info?.access_token?.access_token;

        const request = {
            session
        } as Request;

        try {
            await companyNameProcessor.process(request);
            assert.fail('Expected to throw error');
        } catch (err) {
            expect(err.message).to.equal(TOKEN_MISSING_ERROR.message);
        }

    });
    it('should throw an error if company number is not in the request body', async () => {

        const companyNameProcessor = new CompanyNameProcessor(createSubstituteOf<CompaniesHouseSDK>());
        const session = createSession('secret');

        const request = {
            session,
            body: {
            }
        } as Request;

        try {
            await companyNameProcessor.process(request);
            assert.fail('Expected to throw error');
        } catch (err) {
            expect(err.message).to.equal(COMPANY_NUMBER_UNDEFINED_ERROR.message);
        }
    });
    it('should throw an error if sdk fails to retrieve company profile', async () => {

        const companyProfileService = createSubstituteOf<CompanyProfileService>();

        companyProfileService.getCompanyProfile(Arg.any()).resolves({
            httpStatusCode: 404
        });

        const companiesHouseSDK = (_: AuthMethod) => createSubstituteOf<ApiClient>(sdk => {
            sdk.companyProfile.returns!(companyProfileService);
        });
        const companyNameProcessor = new CompanyNameProcessor(companiesHouseSDK);
        const session = createSession('secret');

        const companyNumber = 'NI000000';

        const request = {
            session,
            body: {
                companyNumber
            }
        } as Request;

        try {
            await companyNameProcessor.process(request);
            assert.fail('Expected to throw error');
        } catch (err) {
            companyProfileService.received().getCompanyProfile(companyNumber);
            expect(err.message).to.equal(COMPANY_NAME_RETRIEVAL_ERROR(companyNumber).message);
        }
    });
    it('should add the company name to the penaltyIdentifier in the body of request', async () => {

        const companyName = 'Test&Test Ltd';
        const companyNumber = 'NI000000';
        const companyProfileService = createSubstituteOf<CompanyProfileService>();

        companyProfileService.getCompanyProfile(companyNumber).resolves({
            httpStatusCode: 200,
            resource: {
                companyName
            } as CompanyProfile
        });

        const companiesHouseSDK = (_: AuthMethod) => createSubstituteOf<ApiClient>(sdk => {
            sdk.companyProfile.returns!(companyProfileService);
        });
        const companyNameProcessor = new CompanyNameProcessor(companiesHouseSDK);
        const session = createSession('secret');

        const request = {
            session,
            body: {
                companyNumber
            }
        } as Request;

        await companyNameProcessor.process(request);
        companyProfileService.received().getCompanyProfile(companyNumber);

        expect(request.body.companyName).to.equal(companyName);

    });
});