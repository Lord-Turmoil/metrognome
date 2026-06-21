import Api from '~/extensions/api';
import bus from '~/extensions/event';
import { AppMeta, VersionMeta, parseAppMeta, parseVersionMeta } from '~/models';
import { ApiErrorResponse } from '~/extensions/api';
import { getElementByIdOrThrow, querySelectorOrThrow } from '~/extensions/dom';
import { PLATFORM_DOM_CONFIG, PLATFORM_ELEMENT_IDS, SupportedPlatform } from '~/platform/config';

export type MetaDisplayPlatform = Extract<SupportedPlatform, 'web' | 'android'>;

const DISCONNECTED_PLACEHOLDER_TEXT = 'Disconnected: update information unavailable.';

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

export function displayVersion(platform: SupportedPlatform): void {
    getElementByIdOrThrow<HTMLElement>(PLATFORM_DOM_CONFIG[platform].versionSectionId).style.display = 'block';
    getElementByIdOrThrow<HTMLElement>(PLATFORM_ELEMENT_IDS.versionWrapper).classList.add('expand');
}

export function showDisconnectedPlaceholder(platform: MetaDisplayPlatform): void {
    displayVersion(platform);

    const section = getElementByIdOrThrow<HTMLElement>(PLATFORM_DOM_CONFIG[platform].versionSectionId);
    const selector = '[data-meta-placeholder="disconnected"]';

    let placeholder = section.querySelector<HTMLElement>(selector);
    if (!placeholder) {
        placeholder = document.createElement('p');
        placeholder.classList.add('Version__placeholder');
        placeholder.setAttribute('data-meta-placeholder', 'disconnected');
        section.appendChild(placeholder);
    }
    placeholder.textContent = DISCONNECTED_PLACEHOLDER_TEXT;

    if (platform === 'web') {
        document.getElementById(PLATFORM_ELEMENT_IDS.web.downloadAndroid)?.classList.add('disabled');
        document.getElementById(PLATFORM_ELEMENT_IDS.web.downloadIos)?.classList.add('disabled');
    } else {
        document.getElementById(PLATFORM_ELEMENT_IDS.android.updateBanner)?.setAttribute('style', 'display: none');
        document.getElementById(PLATFORM_ELEMENT_IDS.android.latestBanner)?.setAttribute('style', 'display: none');
        document.getElementById(PLATFORM_ELEMENT_IDS.android.downloadUpdate)?.classList.add('disabled');
    }
}

export function updateChangelog(platform: SupportedPlatform, versionMeta: VersionMeta): void {
    const changelog = querySelectorOrThrow<HTMLUListElement>(PLATFORM_DOM_CONFIG[platform].changelogSelector);
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

interface VersionParts {
    major: number;
    minor: number;
    patch: number;
}

function parseVersion(version: string): VersionParts {
    let parts = version.split('.').map(Number);
    if (parts.length < 3) {
        parts = parts.fill(0, parts.length, 2);
    }
    return { major: parts[0], minor: parts[1], patch: parts[2] };
}

function formatVersion(version: VersionParts): string {
    return `${version.major}.${version.minor}.${version.patch}`;
}

/**
 * Compare two versions.
 *
 * @param current base version
 * @param latest version to compare
 * @returns true if latest is larger than current
 */
function compareVersionParts(current: VersionParts, latest: VersionParts): number {
    if (current.major != latest.major) {
        return current.major - latest.major;
    } else if (current.minor != latest.minor) {
        return current.minor - latest.minor;
    } else {
        return current.patch - latest.patch;
    }
}

export function isNewerVersion(current: string, latest: string): boolean {
    return compareVersionParts(parseVersion(current), parseVersion(latest)) < 0;
}

export function getLatestVersion(version: string, ...versions: string[]): string {
    versions.push(version);
    versions.sort((a, b) => compareVersionParts(parseVersion(b), parseVersion(a)));
    return versions[0];
}
