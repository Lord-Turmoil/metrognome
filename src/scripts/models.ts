export interface AppMeta {
    latest: string;
    versions: string[];
}

export interface ChangeLog {
    [language: string]: string;
}

export interface VersionMeta {
    date: string;
    changelog: ChangeLog[];
    android?: string;
}

export const CURRENT_VERSION = '1.6.0';
export const PRERELEASE_VERSION = '1.6.0';

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
}

function isStringRecord(value: unknown): value is ChangeLog {
    if (!isRecord(value)) {
        return false;
    }
    return Object.values(value).every((item) => typeof item === 'string');
}

export function isAppMeta(value: unknown): value is AppMeta {
    if (!isRecord(value)) {
        return false;
    }

    const latest = value.latest;
    const versions = value.versions;
    return typeof latest === 'string' && Array.isArray(versions) && versions.every((item) => typeof item === 'string');
}

export function parseAppMeta(value: unknown): AppMeta | null {
    return isAppMeta(value) ? value : null;
}

export function isVersionMeta(value: unknown): value is VersionMeta {
    if (!isRecord(value)) {
        return false;
    }

    const date = value.date;
    const changelog = value.changelog;
    const android = value.android;

    if (typeof date !== 'string') {
        return false;
    }

    if (!Array.isArray(changelog) || !changelog.every((item) => isStringRecord(item))) {
        return false;
    }

    if (android !== undefined && typeof android !== 'string') {
        return false;
    }

    return true;
}

export function parseVersionMeta(value: unknown): VersionMeta | null {
    return isVersionMeta(value) ? value : null;
}
