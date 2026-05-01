import Api from '~/extensions/api';
import bus from '~/extensions/event';
import { AppMeta, VersionMeta, parseAppMeta, parseVersionMeta } from '~/models';

export type MetaFailureReason =
    | 'app-meta-fetch-failed'
    | 'app-meta-invalid'
    | 'version-meta-fetch-failed'
    | 'version-meta-invalid';

export type MetaResponse =
    | {
          ok: true;
          appMeta: AppMeta;
          versionMeta: VersionMeta;
      }
    | {
          ok: false;
          reason: MetaFailureReason;
      };

export async function fetchMeta(): Promise<MetaResponse> {
    const appMetaResponse = await Api.fetch<unknown>('meta.json');
    if (appMetaResponse.status !== 'ok') {
        console.error('Failed to fetch App meta');
        return { ok: false, reason: 'app-meta-fetch-failed' };
    }
    const appMeta = parseAppMeta(appMetaResponse.data);
    if (!appMeta) {
        console.error('Invalid App meta payload');
        return { ok: false, reason: 'app-meta-invalid' };
    }

    const versionMetaResponse = await Api.fetch<unknown>(`${appMeta.latest}/meta.json`);
    if (versionMetaResponse.status !== 'ok') {
        console.error('Failed to fetch Version meta');
        return { ok: false, reason: 'version-meta-fetch-failed' };
    }

    const versionMeta = parseVersionMeta(versionMetaResponse.data);
    if (!versionMeta) {
        console.error('Invalid Version meta payload');
        return { ok: false, reason: 'version-meta-invalid' };
    }

    return { ok: true, appMeta, versionMeta };
}

export function displayVersion(platform: string): void {
    document.getElementById(`version-${platform}`)!.style.display = 'block';
    document.getElementById('version-wrapper')!.classList.add('expand');
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
