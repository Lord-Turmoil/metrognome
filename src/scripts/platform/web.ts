import { PlatformModule } from '../extensions/module';
import { VersionMeta } from '../models';
import { displayVersion, fetchMeta, updateChangelog } from './base';

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
    }
}

export default WebModule;
