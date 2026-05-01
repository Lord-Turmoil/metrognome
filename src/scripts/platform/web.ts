import { VersionMeta } from '~/models';
import { PlatformModule } from '~/extensions/module';
import { displayVersion, fetchMeta, updateChangelog } from '~/platform/base';
import { getElementByIdOrThrow, querySelectorAll } from '~/extensions/dom';

class WebModule extends PlatformModule {
    protected async attach(): Promise<void> {
        const meta = await fetchMeta();
        if (!meta.ok) {
            console.warn(`[platform:web] Skip version update UI because ${meta.reason}`);
            return;
        }

        this.updateVersionText(meta.appMeta.latest);
        this.updateDownloadLink(meta.versionMeta);

        updateChangelog('web', meta.versionMeta);
        displayVersion('web');
    }

    private updateVersionText(version: string): void {
        querySelectorAll<HTMLElement>('.version-text').forEach((element) => {
            element.textContent = version;
        });
    }

    private updateDownloadLink(versionMeta: VersionMeta): void {
        if (!versionMeta.android) {
            console.warn('[platform:web] Missing Android download URL in version metadata');
            return;
        }

        getElementByIdOrThrow<HTMLButtonElement>('web-download-android').onclick = () => {
            window.open(versionMeta.android, '_blank');
        };

        const appStoreUrl = import.meta.env.VITE_APP_STORE_URL;
        if (appStoreUrl) {
            getElementByIdOrThrow<HTMLButtonElement>('web-download-ios').onclick = () => {
                window.open(appStoreUrl, '_blank');
            };
        } else {
            getElementByIdOrThrow<HTMLButtonElement>('web-download-ios').style.display = 'none';
        }
    }
}

export default WebModule;
