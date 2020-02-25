export function returnEnvVarible(name: string, defaultVal?: string): string {
  const variable = process.env[name];
  if (!variable) {
    if (defaultVal !== undefined) {
      return defaultVal;
    }
    throw Error(`Variable ${name} was not found on env files.`);
  }
  return variable;
}
