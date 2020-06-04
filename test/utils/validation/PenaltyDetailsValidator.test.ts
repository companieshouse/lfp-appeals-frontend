import ApiClient from 'ch-sdk-node/dist/client';
import { LateFilingPenaltyService, Penalty, PenaltyList } from 'ch-sdk-node/dist/services/lfp';
import { assert, expect } from 'chai';
import { Request } from 'express';
import { createSubstituteOf } from '../../SubstituteFactory';
import { createSession } from '../session/SessionFactory';

import { SESSION_NOT_FOUND_ERROR, TOKEN_MISSING_ERROR } from 'app/controllers/processors/errors/Errors';
import { PenaltyDetailsValidator } from 'app/controllers/validators/PenaltyDetailsValidator';
import { AuthMethod, CompaniesHouseSDK } from 'app/modules/Types';

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
    const getRequest = (penaltyReference: string): Request => {
        return {
            body: {
                companyNumber,
                penaltyReference
            },
            session: createSession('secret', true)
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

        try {
            await penaltyDetailsValidator.validate({
                session
            } as Request);
            assert.fail('Should have thrown an error');
        } catch (err) {
            expect(err.message).to.equal(TOKEN_MISSING_ERROR.message);
        }
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
    it('should throw an error if there is more than one penalty (TEMPORARY)', async () => {
        const apiResponse = {
            httpStatusCode: 200,
            resource: {
                items: [
                    {
                        id: '000000000',
                        type: 'penalty'
                    } as Penalty,
                    {
                        id: '000000001',
                        type: 'penalty'
                    } as Penalty
                ]
            } as PenaltyList
        };
        const penaltyDetailsValidator = new PenaltyDetailsValidator(createSDK(apiResponse));
        try {
            await penaltyDetailsValidator.validate(getRequest(`PEN1A/${companyNumber}`));
            assert.fail('Should have thrown an error');
        } catch (err) {
            expect(err.message).to.equal(PenaltyDetailsValidator.MULTIPLE_PENALTIES_FOUND_ERROR.message);
        }

    });
    it('should return an error when no items match the penalty', async () => {

        const penaltyReference = 'A0000001';
        const apiResponse = {
            httpStatusCode: 200,
            resource: {
                items: [
                    {
                        id: 'A0000000',
                        type: 'penalty'
                    } as Penalty
                ]
            } as PenaltyList
        };
        const penaltyDetailsValidator = new PenaltyDetailsValidator(createSDK(apiResponse));
        const results = await penaltyDetailsValidator.validate(getRequest(penaltyReference));
        expect(results.errors.length).to.equal(2);

    });
    it('should return no validation errors and add penalty to request body', async () => {

        const penaltyReferences: string[] = ['A0000001', 'A0000002'];
        const apiResponse1 = {
            httpStatusCode: 200,
            resource: {
                items: [
                    {
                        id: penaltyReferences[0],
                        type: 'penalty'
                    } as Penalty,
                    {
                        id: penaltyReferences[1],
                        type: 'penalty'
                    } as Penalty
                ]
            } as PenaltyList
        };
        const apiResponse2 = {
            httpStatusCode: 200,
            resource: {
                items: [
                    {
                        id: penaltyReferences[0],
                        type: 'penalty'
                    } as Penalty
                ]
            } as PenaltyList
        };
        const oldPenaltyReference = `PEN1A/${companyNumber}`;
        const modernPenaltyReference = penaltyReferences[0];

        const penaltyDetailsValidatorOld = new PenaltyDetailsValidator(createSDK(apiResponse2));
        const penaltyDetailsValidatorModern = new PenaltyDetailsValidator(createSDK(apiResponse1));

        const oldPenaltyRequest: Request = getRequest(oldPenaltyReference);
        const modernPenaltyRequest: Request = getRequest(modernPenaltyReference);

        const oldPenaltyReferenceResult = await penaltyDetailsValidatorOld.validate(oldPenaltyRequest);
        const modernPenaltyReferenceResult = await penaltyDetailsValidatorModern.validate(modernPenaltyRequest);

        expect(oldPenaltyReferenceResult.errors.length).to.equal(0);
        expect(oldPenaltyRequest.body.penaltyList).to.deep.equal(apiResponse2.resource);

        expect(modernPenaltyReferenceResult.errors.length).to.equal(0);
        expect(modernPenaltyRequest.body.penaltyList).to.deep.equal(apiResponse1.resource);


    });

});