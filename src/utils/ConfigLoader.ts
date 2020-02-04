import * as dotenv from 'dotenv';

const DEFAULT_ENV_FILE = `${__dirname}/../../.env.local`;

export const loadConfig = () => {
  if (process.env.NODE_ENV) {
    const path = `${__dirname}/../../.env.${process.env.NODE_ENV}`;
    return dotenv.config({ path });
  }
  return dotenv.config({ path: DEFAULT_ENV_FILE });
};

