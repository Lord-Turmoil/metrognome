import { PlatformModule } from '~/extensions/module';

class IosModule extends PlatformModule {
    protected async attach(): Promise<void> {
        document.getElementById('version-wrapper').style.display = 'none';
        document.getElementById('title').onclick = () => {
            window.open(import.meta.env.VITE_WEB_URL || '#', '_blank');
        };
    }
}

export default IosModule;
