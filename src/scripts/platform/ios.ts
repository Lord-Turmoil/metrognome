import { PlatformModule } from '~/extensions/module';
import { CURRENT_VERSION } from '~/models';
import { displayVersion } from '~/platform/base';
import { getElementByIdOrThrow, querySelectorAll } from '~/extensions/dom';
import { PLATFORM_ELEMENT_IDS } from '~/platform/config';
import { initializeIosNativePlayback } from '~/platform/ios-native';

class IosModule extends PlatformModule {
    protected async attach(): Promise<void> {
        void initializeIosNativePlayback();

        querySelectorAll<HTMLElement>(PLATFORM_ELEMENT_IDS.ios.versionTextSelector).forEach((element) => {
            element.textContent = CURRENT_VERSION;
        });
        displayVersion('ios');

        getElementByIdOrThrow<HTMLHeadingElement>(PLATFORM_ELEMENT_IDS.title).onclick = () => {
            window.open(import.meta.env.VITE_WEB_URL || '#', '_blank');
        };
    }
}

export default IosModule;
