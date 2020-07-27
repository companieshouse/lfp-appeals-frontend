import { SessionMiddleware } from 'ch-node-session-handler';
import { OK, UNPROCESSABLE_ENTITY } from 'http-status-codes';
import { controller, httpGet, httpPost } from 'inversify-express-utils';

import { BaseAsyncHttpController } from 'app/controllers/BaseAsyncHttpController';
import { FormValidator } from 'app/controllers/validators/FormValidator';
import { IllnessReasonFeatureMiddleware } from 'app/middleware/IllnessReasonFeatureMiddleware';
import { schema } from 'app/models/fields/IllnessStartDate.schema';
import { ILLNESS_START_DATE_PAGE_URI } from 'app/utils/Paths';
import { ValidationResult } from 'app/utils/validation/ValidationResult';

const template: string = 'illness/illness-start-date';
const startDay: string  = 'startDay';
const startMonth: string  = 'startMonth';
const startYear: string  = 'startYear';
const startDate: string  = 'startDate';

@controller(ILLNESS_START_DATE_PAGE_URI, SessionMiddleware, IllnessReasonFeatureMiddleware)
export class IllnessStartDateController extends BaseAsyncHttpController {

    @httpGet('')
    public async renderView(): Promise<void> {
        return this.render(template);
    }

    @httpPost('')
    public async continue(): Promise<void> {

        const request = this.httpContext.request;

        request.body.startDate = new Date(
            `${request.body[startYear]}-${request.body[startMonth]}-${request.body[startDay]}`);

        let startDateDayErrorFlag: boolean = false;
        let startDateMonthErrorFlag: boolean = false;
        let startDateYearErrorFlag: boolean = false;

        const validationResult: ValidationResult = await new FormValidator(schema).validate(request);

        if (validationResult.errors.length > 0) {

            validationResult.errors.forEach(err => {

                switch (err.field) {
                    case startDay:
                        startDateDayErrorFlag = true;
                        break;
                    case startMonth:
                        startDateMonthErrorFlag = true;
                        break;
                    case startYear:
                        startDateYearErrorFlag = true;
                        break;
                    case startDate:
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
