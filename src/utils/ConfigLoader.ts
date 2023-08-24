import * as dotenv from "dotenv";

import { getEnv } from "app/utils/EnvironmentUtils";

import path from "path";

export const loadEnvironmentVariablesFromFiles = () => {
    const env = getEnv("NODE_ENV");
    if (env) {
        const envFilePath = path.join(__dirname, `/../../.env.${env}`);
        dotenv.config({ path: envFilePath });
    }
};
