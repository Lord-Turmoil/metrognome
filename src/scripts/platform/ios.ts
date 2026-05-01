import { PlatformModule } from '~/extensions/module';
import { getElementByIdOrThrow } from '~/extensions/dom';

class IosModule extends PlatformModule {
    protected async attach(): Promise<void> {
        getElementByIdOrThrow<HTMLElement>('version-wrapper').style.display = 'none';
        getElementByIdOrThrow<HTMLHeadingElement>('title').onclick = () => {
            window.open(import.meta.env.VITE_WEB_URL || '#', '_blank');
        };
    }
}

export default IosModule;
