import { PenaltyList } from "@companieshouse/api-sdk-node/dist/services/lfp";
import { Session } from "@companieshouse/node-session-handler";
import { Request } from "express";
import { FormValidator } from "./FormValidator";

import { ApplicationData, APPLICATION_DATA_KEY } from "app/models/ApplicationData";
import { schema } from "app/models/fields/PenaltyChoice.schema";
import { APPLICATION_DATA_UNDEFINED, SESSION_NOT_FOUND_ERROR } from "app/utils/CommonErrors";
import { ValidationResult } from "app/utils/validation/ValidationResult";

export class MultiplePenaltiesValidator extends FormValidator {
    constructor () {
        super(schema);
    }

    public async validate (request: Request): Promise<ValidationResult> {

        const session: Session | undefined = request.session;

        if (!session) {
            throw SESSION_NOT_FOUND_ERROR;
        }

        const appData: ApplicationData | undefined = session.getExtraData(APPLICATION_DATA_KEY);

        if (!appData) {
            throw APPLICATION_DATA_UNDEFINED;
        }

        const penaltyList: PenaltyList | undefined = appData.appeal.penaltyIdentifier.penaltyList;

        if (!penaltyList || !penaltyList.items) {
            throw new Error("Penalty object expected but none found");
        }

        const result: ValidationResult = await super.validate(request);

        request.body.penaltyList = [...penaltyList.items];

        return result;
    }
}
