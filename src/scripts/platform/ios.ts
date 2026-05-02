import { PlatformModule } from '~/extensions/module';
import { getElementByIdOrThrow } from '~/extensions/dom';
import { PLATFORM_ELEMENT_IDS } from '~/platform/config';
import { initializeIosNativePlayback } from '~/platform/ios-native';

class IosModule extends PlatformModule {
    protected async attach(): Promise<void> {
        void initializeIosNativePlayback();

        getElementByIdOrThrow<HTMLElement>(PLATFORM_ELEMENT_IDS.versionWrapper).style.display = 'none';
        getElementByIdOrThrow<HTMLHeadingElement>(PLATFORM_ELEMENT_IDS.title).onclick = () => {
            window.open(import.meta.env.VITE_WEB_URL || '#', '_blank');
        };
    }
}

export default IosModule;
