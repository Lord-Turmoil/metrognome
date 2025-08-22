import { PlatformModule } from '../extensions/module';
import { CURRENT_VERSION, VersionMeta } from '../models';
import { displayVersion, fetchMeta, isNewerVersion, updateChangelog } from './base';

class AndroidModule extends PlatformModule {
    protected async attach(): Promise<void> {
        const meta = await fetchMeta();
        if (meta.error) {
            return;
        }

        this.updateVersionText(meta.appMeta.latest);

        if (isNewerVersion(CURRENT_VERSION, meta.appMeta.latest)) {
            updateChangelog('android', meta.versionMeta);
            this.updateDownloadLink(meta.versionMeta);
            document.getElementById('android-update').style.display = 'block';
        } else {
            document.getElementById('android-latest').style.display = 'block';
        }

        displayVersion('android');

        document.getElementById('title').onclick = () => {
            window.open(import.meta.env.VITE_WEB_URL || '#', '_blank');
        };
    }

    private updateVersionText(version: string): void {
        document.querySelectorAll('.version-text-current').forEach((element) => {
            element.innerHTML = CURRENT_VERSION;
        });
        document.querySelectorAll('.version-text-latest').forEach((element) => {
            element.innerHTML = version;
        });
    }

    private updateDownloadLink(versionMeta: VersionMeta): void {
        document.getElementById('android-download-update').onclick = () => {
            window.open(versionMeta.android, '_blank');
        };
    }
}

export default AndroidModule;
