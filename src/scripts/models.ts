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

export const CURRENT_VERSION = '1.3.0';
