import { Session } from "@companieshouse/node-session-handler";
import { Request } from "express";
import moment from "moment";

import { DateValidator } from "app/controllers/validators/DateValidator";
import { loggerInstance, loggingMessage } from "app/middleware/Logger";
import { ApplicationData, APPLICATION_DATA_KEY } from "app/models/ApplicationData";
import { Illness } from "app/models/Illness";
import { APPLICATION_DATA_UNDEFINED, SESSION_NOT_FOUND_ERROR } from "app/utils/CommonErrors";
import { ValidationError } from "app/utils/validation/ValidationError";
import { ValidationResult } from "app/utils/validation/ValidationResult";

export class IllnessEndDateValidator extends DateValidator {

    private ILLNESS_END_DATE_BEFORE_ILLNESS_START_DATE: string = "End date must be after the start date";

    constructor () {
        super();
    }

    public async validate (request: Request): Promise<ValidationResult> {

        const dayField: string = "day";
        const monthField: string = "month";
        const yearField: string = "year";
        const dateField: string = "date";

        const session: Session | undefined = request.session;

        if (!session) {
            throw SESSION_NOT_FOUND_ERROR;
        }

        const appData: ApplicationData | undefined = session.getExtraData<ApplicationData>(APPLICATION_DATA_KEY);

        if (!appData) {
            throw APPLICATION_DATA_UNDEFINED;
        }

        const validationResult: ValidationResult = await super.validate(request);

        request.body.date = moment(`${request.body[yearField]}-${request.body[monthField]}-${request.body[dayField]}`)
            .toDate();

        /* Validate that the illness end date is before the illness start date only if
           it has passed all other date validation
         */
        if (validationResult.errors.length === 0) {
            const illness: Illness | undefined = appData.appeal.reasons.illness;
            if (illness != null && illness.illnessStart != null) {

                const illnessStartDate = moment(illness.illnessStart).toDate();
                if (request.body.date < illnessStartDate) {
                    loggerInstance().debug(loggingMessage(appData.appeal, IllnessEndDateValidator.name));

                    const dateError: ValidationError =
                        new ValidationError(dateField, this.ILLNESS_END_DATE_BEFORE_ILLNESS_START_DATE);
                    validationResult.errors.push(dateError);
                }
            }
        }

        return validationResult;
    }
}
