import * as dotenv from 'dotenv';

import { getEnv } from 'app/utils/EnvironmentUtils';

const DEFAULT_ENV_FILE = `.env`;

export const loadEnvironmentVariablesFromFiles = () => {
    const env = getEnv('NODE_ENV');
    const envFile = env ? `.env.${env}` : DEFAULT_ENV_FILE;
    const envFilePath = `${__dirname}/../../${envFile}`;
    dotenv.config({ path: envFilePath });
};
