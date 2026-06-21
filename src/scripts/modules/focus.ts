import { Module } from '~/extensions/module';
import bus from '~/extensions/event';
import { isWebPlatform } from '~/platform/web-native';

class FocusModule extends Module {
    private focused: boolean = false;

    mount(): void {
        bus.on('toggle-focus', this.onToggleFocus.bind(this));
    }

    private onToggleFocus() {
        this.setFocus(!this.focused);
    }

    private setFocus(focused: boolean) {
        this.focused = focused;

        let expandImg = document.getElementById('focus-expand') as HTMLImageElement;
        let shrinkImg = document.getElementById('focus-shrink') as HTMLImageElement;
        if (this.focused) {
            document.body.classList.add('focused');
            expandImg.style.display = 'none';
            shrinkImg.style.display = 'block';
        } else {
            document.body.classList.remove('focused');
            expandImg.style.display = 'block';
            shrinkImg.style.display = 'none';
        }

        this.setFullScreen(this.focused);
    }

    private setFullScreen(fullscreen: boolean) {
        if (!isWebPlatform()) {
            return;
        }

        if (fullscreen) {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    }
}

export default FocusModule;
