import { createLogger } from '@companieshouse/structured-logging-node';
import ApplicationLogger from '@companieshouse/structured-logging-node/lib/ApplicationLogger';

import { APP_NAME } from 'app/Constants';

let logger: ApplicationLogger;

export function loggerInstance(): ApplicationLogger {
    if (!logger) {
        logger = createLogger(APP_NAME);
    }
    return logger;
}
