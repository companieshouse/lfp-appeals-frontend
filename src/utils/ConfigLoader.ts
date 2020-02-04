import * as dotenv from 'dotenv';

const DEFAULT_ENV_FILE = `${__dirname}/../../.env`;

const validateConfig = (config: dotenv.DotenvConfigOutput) => {
  if (config.error) throw config.error;
  else return config;
};

export const loadEnvironmentVariablesFromFiles = () => {
  validateConfig(dotenv.config({ path: DEFAULT_ENV_FILE }));
  if (process.env.NODE_ENV) {
    const path = `${__dirname}/../../.env.${process.env.NODE_ENV}`;
    validateConfig(dotenv.config({ path }));
  }
};

