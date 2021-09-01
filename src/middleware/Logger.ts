import { createLogger } from '@companieshouse/structured-logging-node';
import ApplicationLogger from '@companieshouse/structured-logging-node/lib/ApplicationLogger';

import { APP_NAME } from 'app/Constants';
import { Appeal } from 'app/models/Appeal';

let logger: ApplicationLogger;

export function loggerInstance(): ApplicationLogger {
    if (!logger) {
        logger = createLogger(APP_NAME);
    }
    return logger;
}

export function loggingErrorMessage(appeal : Appeal, className : string): string {

    return `${className} -
    userId: ${appeal.createdBy?.id}
    appealId: ${appeal.id}
    penaltyIdentifier: ${appeal.penaltyIdentifier.penaltyReference}
    companyNumber: ${appeal.penaltyIdentifier.companyNumber}`;
}
