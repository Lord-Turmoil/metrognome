export type SupportedPlatform = 'web' | 'android' | 'ios';

type PlatformDomConfig = {
    versionSectionId: string;
    changelogSelector: string;
};

export const PLATFORM_DOM_CONFIG: Record<SupportedPlatform, PlatformDomConfig> = {
    web: {
        versionSectionId: 'version-web',
        changelogSelector: '.changelog.web',
    },
    android: {
        versionSectionId: 'version-android',
        changelogSelector: '.changelog.android',
    },
    ios: {
        versionSectionId: 'version-ios',
        changelogSelector: '.changelog.ios',
    },
};

export const PLATFORM_ELEMENT_IDS = {
    title: 'title',
    versionWrapper: 'version-wrapper',
    web: {
        downloadAndroid: 'web-download-android',
        downloadIos: 'web-download-ios',
        versionTextSelector: '.version-text',
    },
    android: {
        updateBanner: 'android-update',
        latestBanner: 'android-latest',
        downloadUpdate: 'android-download-update',
        versionCurrentSelector: '.version-text-current',
        versionLatestSelector: '.version-text-latest',
    },
} as const;
