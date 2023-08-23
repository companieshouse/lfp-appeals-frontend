import { createLogger } from "@companieshouse/structured-logging-node";
import ApplicationLogger from "@companieshouse/structured-logging-node/lib/ApplicationLogger";

import { APP_NAME } from "app/Constants";
import { Appeal } from "app/models/Appeal";

let logger: ApplicationLogger;

export function loggerInstance (): ApplicationLogger {
    if (!logger) {
        logger = createLogger(APP_NAME);
    }
    return logger;
}

export function loggingMessage (appeal: Appeal, className: string): string {
    const penaltyReference = appeal.penaltyIdentifier.penaltyReference;
    const companyNumber = appeal.penaltyIdentifier.companyNumber;
    const createdById = appeal.createdBy?.id;
    const penaltyDetails = `penaltyIdentifier: ${penaltyReference} - companyNumber: ${companyNumber}`;

    return `${className} - appealId: ${appeal.id} - userId: ${createdById} - ${penaltyDetails}`;
}
