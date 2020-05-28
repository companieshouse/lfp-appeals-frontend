import 'reflect-metadata';

import Substitute, { Arg } from '@fluffy-spoon/substitute';
import CompanyProfileService from 'ch-sdk-node/dist/services/company-profile/service';
import { CompanyProfile } from 'ch-sdk-node/dist/services/company-profile/types';
import { assert, expect } from 'chai';
import { Request } from 'express';
import { createSubstituteOf } from '../../SubstituteFactory';
import { createSession } from '../../utils/session/SessionFactory';

import {
    CompanyNameProcessor,
    COMPANY_NUMBER_RETRIEVAL_ERROR,
    COMPANY_NUMBER_UNDEFINED_ERROR,
    SESSION_NOT_FOUND_ERROR
} from 'app/controllers/processors/CompanyNameProcessor';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { Navigation } from 'app/models/Navigation';
import { PenaltyIdentifier } from 'app/models/PenaltyIdentifier';
import { Reasons } from 'app/models/Reasons';
import { CompaniesHouseSDK } from 'app/modules/Types';

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
    it('should throw an error if company number is not in the session', async () => {

        const companyNameProcessor = new CompanyNameProcessor(createSubstituteOf<CompaniesHouseSDK>());
        const session = createSession('secret');

        session.setExtraData<ApplicationData>(APPLICATION_DATA_KEY, {
            appeal: {
                penaltyIdentifier: {} as PenaltyIdentifier,
                reasons: createSubstituteOf<Reasons>()
            },
            navigation: createSubstituteOf<Navigation>()
        });

        const request = {
            session
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

        const companiesHouseSDK = createSubstituteOf<CompaniesHouseSDK>(sdk => {
            sdk.companyProfile.returns!(companyProfileService);
        });
        const companyNameProcessor = new CompanyNameProcessor(companiesHouseSDK);
        const session = createSession('secret');

        const companyNumber = 'NI000000';

        session.setExtraData<ApplicationData>(APPLICATION_DATA_KEY, {
            appeal: {
                penaltyIdentifier: {
                    companyNumber
                } as PenaltyIdentifier,
                reasons: createSubstituteOf<Reasons>()
            },
            navigation: createSubstituteOf<Navigation>()
        });

        const request = {
            session
        } as Request;

        try {
            await companyNameProcessor.process(request);
            assert.fail('Expected to throw error');
        } catch (err) {
            companyProfileService.received().getCompanyProfile(companyNumber);
            expect(err.message).to.equal(COMPANY_NUMBER_RETRIEVAL_ERROR(companyNumber).message);
        }
    });
    it('should add the company name to the penaltyIdentifier in the session', async () => {

        const companyName = 'Test&Test Ltd';
        const companyNumber = 'NI000000';
        const companyProfileService = createSubstituteOf<CompanyProfileService>();

        companyProfileService.getCompanyProfile(companyNumber).resolves({
            httpStatusCode: 200,
            resource: {
                companyName
            } as CompanyProfile
        });

        const companiesHouseSDK = createSubstituteOf<CompaniesHouseSDK>(sdk => {
            sdk.companyProfile.returns!(companyProfileService);
        });
        const companyNameProcessor = new CompanyNameProcessor(companiesHouseSDK);
        const session = createSession('secret');

        session.setExtraData<ApplicationData>(APPLICATION_DATA_KEY, {
            appeal: {
                penaltyIdentifier: {
                    companyNumber
                } as PenaltyIdentifier,
                reasons: createSubstituteOf<Reasons>()
            },
            navigation: createSubstituteOf<Navigation>()
        });

        const request = {
            session
        } as Request;

        await companyNameProcessor.process(request);
        companyProfileService.received().getCompanyProfile(companyNumber);

    });
});