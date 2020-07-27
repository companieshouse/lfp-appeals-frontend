import { SessionMiddleware } from 'ch-node-session-handler';
import { OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { controller, httpGet, httpPost } from 'inversify-express-utils';

import { BaseAsyncHttpController } from 'app/controllers/BaseAsyncHttpController';
import { FormValidator } from 'app/controllers/validators/FormValidator';
import { schema } from 'app/models/fields/Illness.schema';
import { ILLNESS_START_DATE_PAGE_URI } from 'app/utils/Paths';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

const template = 'illness/illness-start-date';
const ILLNESS_START_DAY_FIELD = 'startDay';
const ILLNESS_START_MONTH_FIELD = 'startMonth';
const ILLNESS_START_YEAR_FIELD = 'startYear';
const ILLNESS_FULL_DATE = 'startDate';

@controller(ILLNESS_START_DATE_PAGE_URI, SessionMiddleware)
export class IllnessStartDateController extends BaseAsyncHttpController {

    @httpGet('')
    public async renderView(): Promise<void> {
        return this.render(template);
    }

    @httpPost('')
    public async continue(): Promise<void> {

        const request = this.httpContext.request;

        request.body.startDate = new Date(
            `${request.body[ILLNESS_START_YEAR_FIELD]}-${request.body[ILLNESS_START_MONTH_FIELD]}-${request.body[ILLNESS_START_DAY_FIELD]}`);

        let startDateDayErrorFlag: boolean = false;
        let startDateMonthErrorFlag: boolean = false;
        let startDateYearErrorFlag: boolean = false;

        const validationResult: ValidationResult = await new FormValidator(schema).validate(request);

        if (validationResult.errors.length > 0) {

            validationResult.errors.forEach(err => {

                switch (err.field) {
                    case ILLNESS_START_DAY_FIELD:
                        startDateDayErrorFlag = true;
                        break;
                    case ILLNESS_START_MONTH_FIELD:
                        startDateMonthErrorFlag = true;
                        break;
                    case ILLNESS_START_YEAR_FIELD:
                        startDateYearErrorFlag = true;
                        break;
                    case ILLNESS_FULL_DATE:
                        if (startDateDayErrorFlag || startDateMonthErrorFlag || startDateYearErrorFlag) {
                            validationResult.errors.splice(validationResult.errors.indexOf(err), 1);
                        }
                        startDateDayErrorFlag = true;
                        startDateMonthErrorFlag = true;
                        startDateYearErrorFlag = true;
                        break;
                }
            });
            return this.renderWithStatus(UNPROCESSABLE_ENTITY)(
                template, {
                    validationResult,
                    isStartDateDayErrorFlag: startDateDayErrorFlag,
                    isStartDateMonthErrorFlag: startDateMonthErrorFlag,
                    isStartDateYearErrorFlag: startDateYearErrorFlag,
                });
        } else {
            return this.renderWithStatus(OK)(template);
        }
    }
}
