import { VersionMeta } from '~/models';
import { PlatformModule } from '~/extensions/module';
import { displayVersion, fetchMeta, updateChangelog } from '~/platform/base';

class WebModule extends PlatformModule {
    protected async attach(): Promise<void> {
        const meta = await fetchMeta();
        if (meta.error) {
            return;
        }

        this.updateVersionText(meta.appMeta.latest);
        this.updateDownloadLink(meta.versionMeta);

        updateChangelog('web', meta.versionMeta);
        displayVersion('web');
    }

    private updateVersionText(version: string): void {
        document.querySelectorAll('.version-text').forEach((element) => {
            element.innerHTML = version;
        });
    }

    private updateDownloadLink(versionMeta: VersionMeta): void {
        document.getElementById('web-download-android').onclick = () => {
            window.open(versionMeta.android, '_blank');
        };

        const appStoreUrl = import.meta.env.VITE_APP_STORE_URL;
        if (appStoreUrl) {
            document.getElementById('web-download-ios').onclick = () => {
                window.open(appStoreUrl, '_blank');
            };
        } else {
            document.getElementById('web-download-ios').style.display = 'none';
        }
    }
}

export default WebModule;
