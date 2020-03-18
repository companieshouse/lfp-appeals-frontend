export function getEnv(name: string): string | undefined {
    return process.env[name];
}

export function getEnvOr(name: string, fallbackSupplier: () => string): string {
    const value = getEnv(name);
    if (value) {
        return value;
    }
    return fallbackSupplier();
}

export function getEnvOrDefault(name: string, defaultValue: string): string {
    return getEnvOr(name, () => defaultValue);
}

export function getEnvOrThrow(name: string): string {
    return getEnvOr(name, () => { throw Error(`Variable ${name} was not found`) });
}
