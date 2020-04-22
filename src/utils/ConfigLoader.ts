import * as dotenv from 'dotenv';

const DEFAULT_ENV_FILE = `${__dirname}/../../.env`;

export const loadEnvironmentVariablesFromFiles = () => {
    dotenv.config({ path: DEFAULT_ENV_FILE });
    if (process.env.NODE_ENV) {
        const envFilePath = `${__dirname}/../../.env.${process.env.NODE_ENV}`;
        dotenv.config({ path: envFilePath });
    }
};
