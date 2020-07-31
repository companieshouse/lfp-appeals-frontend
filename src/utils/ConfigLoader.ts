import * as dotenv from 'dotenv';

import { getEnv } from 'app/utils/EnvironmentUtils';

export const loadEnvironmentVariablesFromFiles = () => {
    const env = getEnv('NODE_ENV');
    if (env) {
        const envFilePath = `${__dirname}/../../.env.${env}`;
        dotenv.config({ path: envFilePath });
    }
};
