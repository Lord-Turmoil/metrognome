import { PlatformModule } from '~/extensions/module';
import { CURRENT_VERSION, VersionMeta } from '~/models';
import { displayVersion, fetchMeta, isNewerVersion, updateChangelog } from '~/platform/base';

class IosModule extends PlatformModule {
    protected async attach(): Promise<void> {
        document.getElementById('version-wrapper').style.display = 'none';
        document.getElementById('title').onclick = () => {
            window.open(import.meta.env.VITE_WEB_URL || '#', '_blank');
        };
    }
}

export default IosModule;
