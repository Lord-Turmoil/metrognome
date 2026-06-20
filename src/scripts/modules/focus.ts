import { Module } from "~/extensions/module";
import bus from '~/extensions/event';

class FocusModule extends Module {
    mount(): void {
        bus.on('toggle-focus', this.onToggleFocus.bind(this))
    }

    private onToggleFocus() {
        
    }
}

export default FocusModule;
