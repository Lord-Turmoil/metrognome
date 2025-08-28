import Api from '~/extensions/api';
import bus from '~/extensions/event';
import { AppMeta, VersionMeta } from '~/models';

export interface MetaResponse {
    error: boolean;
    appMeta?: AppMeta;
    versionMeta?: VersionMeta;
}

export async function fetchMeta(): Promise<MetaResponse> {
    let response = await Api.fetch('meta.json');
    if (response.status !== 'ok') {
        console.error('Failed to fetch App meta');
        return { error: true };
    }
    const appMeta = response.data as AppMeta;

    response = await Api.fetch(`${appMeta.latest}/meta.json`);
    if (response.status !== 'ok') {
        console.error('Failed to fetch Version meta');
        return { error: true };
    }
    const versionMeta = response.data as VersionMeta;

    return { error: false, appMeta, versionMeta };
}

export function displayVersion(platform: string): void {
    document.getElementById(`version-${platform}`).style.display = 'block';
    document.getElementById('version-wrapper').classList.add('expand');
}

export function updateChangelog(platform: string, versionMeta: VersionMeta): void {
    const changelog = document.querySelector(`.changelog.${platform}`) as HTMLUListElement;
    for (const message of versionMeta.changelog) {
        const item = document.createElement('li');
        item.classList.add('item', 'i18n');
        item.setAttribute('data-i18n', '_');
        for (const [language, text] of Object.entries(message)) {
            item.setAttribute(`data-i18n-${language}`, text);
        }
        changelog.appendChild(item);
    }
    bus.emit('update-language');
}

export function isNewerVersion(current: string, latest: string): boolean {
    const currentParts = current.split('.').map(Number);
    const latestParts = latest.split('.').map(Number);

    for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
        const currentPart = currentParts[i] || 0;
        const latestPart = latestParts[i] || 0;

        if (latestPart > currentPart) {
            return true;
        } else if (latestPart < currentPart) {
            return false;
        }
    }
    return false;
}
