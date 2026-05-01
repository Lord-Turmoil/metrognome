import { PlatformModule } from '~/extensions/module';
import { CURRENT_VERSION, VersionMeta } from '~/models';
import {
    displayVersion,
    fetchMeta,
    isNewerVersion,
    showDisconnectedPlaceholder,
    updateChangelog,
} from '~/platform/base';
import { getElementByIdOrThrow, querySelectorAll } from '~/extensions/dom';
import { PLATFORM_ELEMENT_IDS } from '~/platform/config';

class AndroidModule extends PlatformModule {
    protected async attach(): Promise<void> {
        window.setTimeout(() => {
            this.loadMetaInBackground().catch((error: unknown) => {
                console.error('[platform:android] Metadata background task failed', error);
                showDisconnectedPlaceholder('android');
            });
        }, 0);
    }

    private async loadMetaInBackground(): Promise<void> {
        const meta = await fetchMeta();
        if (!meta.ok) {
            console.warn(`[platform:android] Skip version update UI because ${meta.reason}`);
            showDisconnectedPlaceholder('android');
            return;
        }

        this.updateVersionText(meta.appMeta.latest);

        if (isNewerVersion(CURRENT_VERSION, meta.appMeta.latest)) {
            updateChangelog('android', meta.versionMeta);
            this.updateDownloadLink(meta.versionMeta);
            getElementByIdOrThrow<HTMLElement>(PLATFORM_ELEMENT_IDS.android.updateBanner).style.display = 'block';
        } else {
            getElementByIdOrThrow<HTMLElement>(PLATFORM_ELEMENT_IDS.android.latestBanner).style.display = 'block';
        }

        displayVersion('android');

        getElementByIdOrThrow<HTMLHeadingElement>(PLATFORM_ELEMENT_IDS.title).onclick = () => {
            window.open(import.meta.env.VITE_WEB_URL || '#', '_blank');
        };
    }

    private updateVersionText(version: string): void {
        querySelectorAll<HTMLElement>(PLATFORM_ELEMENT_IDS.android.versionCurrentSelector).forEach((element) => {
            element.textContent = CURRENT_VERSION;
        });
        querySelectorAll<HTMLElement>(PLATFORM_ELEMENT_IDS.android.versionLatestSelector).forEach((element) => {
            element.textContent = version;
        });
    }

    private updateDownloadLink(versionMeta: VersionMeta): void {
        if (!versionMeta.android) {
            console.warn('[platform:android] Missing Android download URL in version metadata');
            return;
        }

        getElementByIdOrThrow<HTMLButtonElement>(PLATFORM_ELEMENT_IDS.android.downloadUpdate).onclick = () => {
            window.open(versionMeta.android, '_blank');
        };
    }
}

export default AndroidModule;
