export function getEnvOrDefault(name: string, defaultVal?: string): string {
  const value = process.env[name];
  if (!value) {
    if (defaultVal !== undefined) {
      return defaultVal;
    }
    throw Error(`Variable ${name} was not found`);
  }
  return value;
}
