import Api from '~/extensions/api';
import bus from '~/extensions/event';
import { AppMeta, VersionMeta, parseAppMeta, parseVersionMeta } from '~/models';
import { ApiErrorResponse } from '~/extensions/api';
import { getElementByIdOrThrow, querySelectorOrThrow } from '~/extensions/dom';

export type MetaFailureReason =
    | 'app-meta-network-error'
    | 'app-meta-server-error'
    | 'app-meta-invalid-json'
    | 'app-meta-invalid'
    | 'version-meta-network-error'
    | 'version-meta-server-error'
    | 'version-meta-invalid-json'
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
          httpStatus?: number;
      };

function mapFailureReason(prefix: 'app-meta' | 'version-meta', response: ApiErrorResponse): MetaFailureReason {
    if (response.status === 'network-error') {
        return `${prefix}-network-error`;
    }
    if (response.status === 'invalid-json') {
        return `${prefix}-invalid-json`;
    }
    return `${prefix}-server-error`;
}

function logMetaFailure(meta: Extract<MetaResponse, { ok: false }>): void {
    if (meta.httpStatus !== undefined) {
        console.error(`[meta] ${meta.reason} (http ${meta.httpStatus})`);
    } else {
        console.error(`[meta] ${meta.reason}`);
    }
}

export async function fetchMeta(): Promise<MetaResponse> {
    const appMetaResponse = await Api.fetch<unknown>('meta.json');
    if (appMetaResponse.status !== 'ok') {
        const failed: Extract<MetaResponse, { ok: false }> = {
            ok: false,
            reason: mapFailureReason('app-meta', appMetaResponse),
            httpStatus: appMetaResponse.httpStatus,
        };
        logMetaFailure(failed);
        return failed;
    }

    const appMeta = parseAppMeta(appMetaResponse.data);
    if (!appMeta) {
        const failed: Extract<MetaResponse, { ok: false }> = { ok: false, reason: 'app-meta-invalid' };
        logMetaFailure(failed);
        return failed;
    }

    const versionMetaResponse = await Api.fetch<unknown>(`${appMeta.latest}/meta.json`);
    if (versionMetaResponse.status !== 'ok') {
        const failed: Extract<MetaResponse, { ok: false }> = {
            ok: false,
            reason: mapFailureReason('version-meta', versionMetaResponse),
            httpStatus: versionMetaResponse.httpStatus,
        };
        logMetaFailure(failed);
        return failed;
    }

    const versionMeta = parseVersionMeta(versionMetaResponse.data);
    if (!versionMeta) {
        const failed: Extract<MetaResponse, { ok: false }> = { ok: false, reason: 'version-meta-invalid' };
        logMetaFailure(failed);
        return failed;
    }

    return { ok: true, appMeta, versionMeta };
}

export function displayVersion(platform: string): void {
    getElementByIdOrThrow<HTMLElement>(`version-${platform}`).style.display = 'block';
    getElementByIdOrThrow<HTMLElement>('version-wrapper').classList.add('expand');
}

export function updateChangelog(platform: string, versionMeta: VersionMeta): void {
    const changelog = querySelectorOrThrow<HTMLUListElement>(`.changelog.${platform}`);
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
