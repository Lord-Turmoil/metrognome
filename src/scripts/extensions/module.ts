/**
 * Bases module class.
 */
export class Module {
    /**
     * Bootstrap the module.
     *
     * This method is called when the module is loaded.
     */
    mount(): void {}
}

export class PlatformModule extends Module {
    mount(): void {
        this.attach().catch((error: unknown) => {
            this.onAttachError(error);
        });
    }

    protected onAttachError(error: unknown): void {
        console.error(`[platform] Failed to attach ${this.constructor.name}`, error);
    }

    protected async attach(): Promise<void> {}
}

/**
 * Base application class that manages modules.
 */
export class App {
    load(module: Module): App {
        module.mount();
        return this;
    }
}
