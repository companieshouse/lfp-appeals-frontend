import ApiClient from 'ch-sdk-node/dist/client';
import { LateFilingPenaltyService, Penalty, PenaltyList } from 'ch-sdk-node/dist/services/lfp';
import { assert, expect } from 'chai';
import { Request } from 'express';

import { PenaltyDetailsValidator } from 'app/controllers/validators/PenaltyDetailsValidator';
import { Appeal } from 'app/models/Appeal';
import { ApplicationData, APPLICATION_DATA_KEY } from 'app/models/ApplicationData';
import { AuthMethod, CompaniesHouseSDK } from 'app/modules/Types';
import { SESSION_NOT_FOUND_ERROR, TOKEN_MISSING_ERROR } from 'app/utils/CommonErrors';

import { createSubstituteOf } from 'test/SubstituteFactory';
import { createSession } from 'test/utils/session/SessionFactory';

describe('PenaltyDetailsValidator', () => {
    const createSDK = (apiResponse: any): CompaniesHouseSDK => {
        const lateFillingPenaltyService = createSubstituteOf<LateFilingPenaltyService>(config => {
            config.getPenalties(companyNumber).resolves(apiResponse);
        });
        const chApi: ApiClient = createSubstituteOf<ApiClient>(config => {
            config.lateFilingPenalties.returns!(lateFillingPenaltyService);
        });
        return (_: AuthMethod) => chApi;
    };
    const companyNumber = 'NI000000';
    const getRequest = (userInputPenaltyReference: string): Request => {
        const session = createSession('secret', true);

        session.setExtraData<ApplicationData>(APPLICATION_DATA_KEY, {
            appeal: {} as Appeal,
            navigation: { permissions: [] }
        });

        return {
            body: {
                companyNumber,
                userInputPenaltyReference
            },
            session
        } as Request;
    };

    it('should throw an error if session is undefined', async () => {
        const penaltyDetailsValidator = new PenaltyDetailsValidator(createSDK({}));
        try {
            await penaltyDetailsValidator.validate({} as Request);
            assert.fail('Should have thrown an error');
        } catch (err) {
            expect(err.message).to.equal(SESSION_NOT_FOUND_ERROR.message);
        }
    });

    it('should throw an error if access token is undefined', async () => {
        const penaltyDetailsValidator = new PenaltyDetailsValidator(createSDK({}));
        const session = createSession('secret', false);
        delete session.data.signin_info?.access_token?.access_token;

        session.setExtraData<ApplicationData>(APPLICATION_DATA_KEY, {
            appeal: {} as Appeal,
            navigation: { permissions: [] }
        });

        try {
            await penaltyDetailsValidator.validate({
                session
            } as Request);
            assert.fail('Should have thrown an error');
        } catch (err) {
            expect(err.message).to.equal(TOKEN_MISSING_ERROR.message);
        }
    });

    it('should return validation error if company number not in E5', async () => {
        const mapErrorMessage = 'Cannot read property \'map\' of null';

        const lfpService = createSubstituteOf<LateFilingPenaltyService>();

        lfpService.getPenalties('SC123123').throws(new Error(mapErrorMessage));

        const apiClient = createSubstituteOf<ApiClient>(sdk => {
            sdk.lateFilingPenalties.returns!(lfpService);
        });
        const companiesHouseSDK = (_: AuthMethod) => apiClient;

        const penaltyDetailsValidator = new PenaltyDetailsValidator(companiesHouseSDK);

        const session = createSession('secret', true);
        session.setExtraData<ApplicationData>(APPLICATION_DATA_KEY, {
            appeal: {} as Appeal,
            navigation: { permissions: [] }
        });

        const result = await penaltyDetailsValidator.validate({
            session,
            body: {
                companyNumber: 'SC123123',
                userInputPenaltyReference: 'A00000000'
            }
        } as Request);

        expect(result.errors).to.deep.equal([
            PenaltyDetailsValidator.COMPANY_NUMBER_VALIDATION_ERROR,
            PenaltyDetailsValidator.PENALTY_REFERENCE_VALIDATION_ERROR
        ]);


    });

    it('should throw an error if ch-sdk fails', async () => {
        const penaltyReference = 'A0000001';

        const chApi: ApiClient = createSubstituteOf<ApiClient>(config => {
            config.lateFilingPenalties.throws!(new Error('Some error'));
        });
        const chSDK = (_: AuthMethod) => chApi;

        const penaltyDetailsValidator = new PenaltyDetailsValidator(chSDK);
        try {
            await penaltyDetailsValidator.validate(getRequest(penaltyReference));
            assert.fail('Should have thrown an error');
        } catch (err) {
            expect(err.message).to.equal(`Can't access API: Error: Some error`);
        }
    });

    it('should return a validation error if no penalty items are received', async () => {
        const penaltyReference = 'A0000001';

        const apiResponse = {
            httpStatusCode: 200,
            resource: {
                items: [] as Penalty[]
            } as PenaltyList
        };

        const penaltyDetailsValidator = new PenaltyDetailsValidator(createSDK(apiResponse));
        const result = await penaltyDetailsValidator.validate(getRequest(penaltyReference));
        expect(result.errors).to.deep.equal([
            PenaltyDetailsValidator.COMPANY_NUMBER_VALIDATION_ERROR,
            PenaltyDetailsValidator.PENALTY_REFERENCE_VALIDATION_ERROR
        ]);

    });

    it('should return an error when no items match the penalty', async () => {

        const penaltyReference = 'A0000001';
        const apiResponse = {
            httpStatusCode: 200,
            resource: {
                items: [
                    {
                        id: 'A0000000',
                        type: 'penalty',
                        madeUpDate: '2020-10-10',
                        transactionDate: '2020-11-10'
                    } as Penalty
                ]
            } as PenaltyList
        };
        const penaltyDetailsValidator = new PenaltyDetailsValidator(createSDK(apiResponse));
        const request = getRequest(penaltyReference);
        const results = await penaltyDetailsValidator.validate(request);
        expect(results.errors.length).to.equal(2);

        const navigation = request.session!.getExtraData<ApplicationData>(APPLICATION_DATA_KEY)?.navigation;
        expect(navigation?.permissions).to.deep.equal([]);

    });

    it('should return no validation errors and add penalty to request body for modern PR numbers', async () => {

        const penaltyReferences: string[] = ['A0000001', 'A0000002'];

        const items = [
            {
                id: penaltyReferences[0],
                type: 'penalty',
                madeUpDate: '2020-10-10',
                transactionDate: '2020-11-10'
            } as Penalty,
            {
                id: penaltyReferences[1],
                type: 'penalty',
                madeUpDate: '2020-10-10',
                transactionDate: '2020-11-10'
            } as Penalty
        ];
        const mappedItems = [
            {
                id: penaltyReferences[0],
                type: 'penalty',
                madeUpDate: '10 October 2020',
                transactionDate: '10 November 2020'
            } as Penalty
        ];

        const apiResponse = {
            httpStatusCode: 200,
            resource: {
                items
            } as PenaltyList
        };

        const modernPenaltyReference = penaltyReferences[0];

        const penaltyDetailsValidatorModern = new PenaltyDetailsValidator(createSDK(apiResponse));

        const modernPenaltyRequest: Request = getRequest(modernPenaltyReference);

        const modernPenaltyReferenceResult = await penaltyDetailsValidatorModern.validate(modernPenaltyRequest);

        expect(modernPenaltyReferenceResult.errors.length).to.equal(0);
        expect(modernPenaltyRequest.body.penaltyList.items[0]).to.deep.equal(mappedItems[0]);

    });

    it('should return no validation errors and add penalty to request body for deprecated PR numbers', () => {

        const penaltyReferences = [
            `PEN1A/${companyNumber}`,
            `PEN1B/${companyNumber}`,
            `PEN0Z/00000000`
        ];

        const items = [
            {
                id: 'A0000001',
                type: 'penalty',
                madeUpDate: '2020-10-10',
                transactionDate: '2020-11-10'
            } as Penalty
        ];
        const mappedItems = [
            {
                id: 'A0000001',
                type: 'penalty',
                madeUpDate: '10 October 2020',
                transactionDate: '10 November 2020'
            } as Penalty
        ];
        const apiResponse = {
            httpStatusCode: 200,
            resource: {
                items
            } as PenaltyList
        };

        penaltyReferences.forEach(async penaltyReference => {

            const penaltyDetailsValidatorOld = new PenaltyDetailsValidator(createSDK(apiResponse));
            const oldPenaltyRequest: Request = getRequest(penaltyReference);

            const oldPenaltyReferenceResult = await penaltyDetailsValidatorOld.validate(oldPenaltyRequest);

            expect(oldPenaltyReferenceResult.errors.length).to.equal(0);
            expect(oldPenaltyRequest.body.penaltyList.items[0]).to.deep.equal(mappedItems);
            expect(oldPenaltyRequest.body.penaltyReference).to.equal(mappedItems[0].id);
        });

    });

});