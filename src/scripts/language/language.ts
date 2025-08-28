import EN_DICT from '~/language/en';
import RU_DICT from '~/language/ru';
import ZH_DICT from '~/language/zh';
import bus from '~/extensions/event';
import Storage from '~/extensions/storage';
import { Module } from '~/extensions/module';

class LanguageManager extends Module {
    private readonly dictionary: Map<string, Map<string, string>> = new Map([
        ['en', new Map<string, string>(Object.entries(EN_DICT))],
        ['ru', new Map<string, string>(Object.entries(RU_DICT))],
        ['zh', new Map<string, string>(Object.entries(ZH_DICT))],
    ]);
    private fallbackDictionary: Map<string, string> = new Map(Object.entries(EN_DICT));

    private supportedLanguages: string[] = ['en', 'zh', 'ru'];
    private currentLanguage: number = 0;

    mount(): void {
        this.currentLanguage = Storage.loadInt('language', 0);
        if (this.currentLanguage < 0 || this.currentLanguage >= this.supportedLanguages.length) {
            this.currentLanguage = 0; // Default to the first language if out of bounds
        }

        this.updateDisplayLanguage();

        bus.on('change-language', this.onChangeLanguage.bind(this));
        bus.on('update-language', this.updateDisplayLanguage.bind(this));
    }

    private onChangeLanguage(): void {
        this.currentLanguage = (this.currentLanguage + 1) % this.supportedLanguages.length;

        this.updateDisplayLanguage();
        Storage.save('language', this.currentLanguage);
    }

    /**
     * Update all the text in the page.
     */
    private updateDisplayLanguage(): void {
        document.body.className = this.supportedLanguages[this.currentLanguage];

        document.querySelectorAll('[data-i18n]').forEach((element) => {
            const key = element.getAttribute('data-i18n');
            element.textContent = this.getText(key, element);
        });
    }

    private getText(key: string | null, element: Element): string {
        if (!key) {
            return 'MISSING';
        }

        const language = this.supportedLanguages[this.currentLanguage];
        const dictionary = this.dictionary.get(language);
        if (!dictionary) {
            console.warn(`Language "${language}" not found in dictionary.`);
            return 'MISSING';
        }

        const text = dictionary.get(key) || this.fallbackDictionary.get(key);
        if (text) {
            return text;
        }

        return element.getAttribute(`data-i18n-${language}`) || 'MISSING';
    }
}

export default LanguageManager;
