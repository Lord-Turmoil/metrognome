import { VersionMeta } from '~/models';
import { PlatformModule } from '~/extensions/module';
import { displayVersion, fetchMeta, showDisconnectedPlaceholder, updateChangelog } from '~/platform/base';
import { getElementByIdOrThrow, querySelectorAll } from '~/extensions/dom';
import { PLATFORM_ELEMENT_IDS } from '~/platform/config';

class WebModule extends PlatformModule {
    protected async attach(): Promise<void> {
        window.setTimeout(() => {
            this.loadMetaInBackground().catch((error: unknown) => {
                console.error('[platform:web] Metadata background task failed', error);
                showDisconnectedPlaceholder('web');
            });
        }, 0);
    }

    private async loadMetaInBackground(): Promise<void> {
        const meta = await fetchMeta();
        if (!meta.ok) {
            console.warn(`[platform:web] Skip version update UI because ${meta.reason}`);
            showDisconnectedPlaceholder('web');
            return;
        }

        this.updateVersionText(meta.appMeta.latest);
        this.updateDownloadLink(meta.versionMeta);

        updateChangelog('web', meta.versionMeta);
        displayVersion('web');
    }

    private updateVersionText(version: string): void {
        querySelectorAll<HTMLElement>(PLATFORM_ELEMENT_IDS.web.versionTextSelector).forEach((element) => {
            element.textContent = version;
        });
    }

    private updateDownloadLink(versionMeta: VersionMeta): void {
        if (!versionMeta.android) {
            console.warn('[platform:web] Missing Android download URL in version metadata');
            return;
        }

        getElementByIdOrThrow<HTMLButtonElement>(PLATFORM_ELEMENT_IDS.web.downloadAndroid).onclick = () => {
            window.open(versionMeta.android, '_blank');
        };

        const appStoreUrl = import.meta.env.VITE_APP_STORE_URL;
        if (appStoreUrl) {
            getElementByIdOrThrow<HTMLButtonElement>(PLATFORM_ELEMENT_IDS.web.downloadIos).onclick = () => {
                window.open(appStoreUrl, '_blank');
            };
        } else {
            getElementByIdOrThrow<HTMLButtonElement>(PLATFORM_ELEMENT_IDS.web.downloadIos).style.display = 'none';
        }
    }
}

export default WebModule;
