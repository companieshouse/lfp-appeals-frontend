import * as dotenv from 'dotenv';

import { getEnvOrThrow } from 'app/utils/EnvironmentUtils';

export const loadEnvironmentVariablesFromFiles = () => {
    const env = getEnvOrThrow('NODE_ENV');
    const envFilePath = `${__dirname}/../../.env.${env}`;
    dotenv.config({ path: envFilePath });
};
