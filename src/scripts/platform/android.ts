import { PlatformModule } from '~/extensions/module';
import { CURRENT_VERSION, VersionMeta } from '~/models';
import { displayVersion, fetchMeta, isNewerVersion, updateChangelog } from '~/platform/base';
import { getElementByIdOrThrow, querySelectorAll } from '~/extensions/dom';

class AndroidModule extends PlatformModule {
    protected async attach(): Promise<void> {
        const meta = await fetchMeta();
        if (!meta.ok) {
            console.warn(`[platform:android] Skip version update UI because ${meta.reason}`);
            return;
        }

        this.updateVersionText(meta.appMeta.latest);

        if (isNewerVersion(CURRENT_VERSION, meta.appMeta.latest)) {
            updateChangelog('android', meta.versionMeta);
            this.updateDownloadLink(meta.versionMeta);
            getElementByIdOrThrow<HTMLElement>('android-update').style.display = 'block';
        } else {
            getElementByIdOrThrow<HTMLElement>('android-latest').style.display = 'block';
        }

        displayVersion('android');

        getElementByIdOrThrow<HTMLHeadingElement>('title').onclick = () => {
            window.open(import.meta.env.VITE_WEB_URL || '#', '_blank');
        };
    }

    private updateVersionText(version: string): void {
        querySelectorAll<HTMLElement>('.version-text-current').forEach((element) => {
            element.textContent = CURRENT_VERSION;
        });
        querySelectorAll<HTMLElement>('.version-text-latest').forEach((element) => {
            element.textContent = version;
        });
    }

    private updateDownloadLink(versionMeta: VersionMeta): void {
        if (!versionMeta.android) {
            console.warn('[platform:android] Missing Android download URL in version metadata');
            return;
        }

        getElementByIdOrThrow<HTMLButtonElement>('android-download-update').onclick = () => {
            window.open(versionMeta.android, '_blank');
        };
    }
}

export default AndroidModule;
