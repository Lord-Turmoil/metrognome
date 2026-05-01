import { describe, expect, it } from 'vitest';

import { isAppMeta, isVersionMeta, parseAppMeta, parseVersionMeta } from '~/models';

describe('models metadata parsing', () => {
    it('accepts a valid AppMeta payload', () => {
        const payload = {
            latest: '1.4.6',
            versions: ['1.4.6', '1.4.5'],
        };

        expect(isAppMeta(payload)).toBe(true);
        expect(parseAppMeta(payload)).toEqual(payload);
    });

    it('rejects an invalid AppMeta payload', () => {
        const payload = {
            latest: 146,
            versions: ['1.4.6'],
        };

        expect(isAppMeta(payload)).toBe(false);
        expect(parseAppMeta(payload)).toBeNull();
    });

    it('accepts a valid VersionMeta payload', () => {
        const payload = {
            date: '2025-10-01',
            changelog: [{ en: 'fix bug', zh: '修复问题' }],
            android: 'https://example.com/app.apk',
        };

        expect(isVersionMeta(payload)).toBe(true);
        expect(parseVersionMeta(payload)).toEqual(payload);
    });

    it('rejects a VersionMeta payload with non-string changelog values', () => {
        const payload = {
            date: '2025-10-01',
            changelog: [{ en: 'ok', count: 1 }],
        };

        expect(isVersionMeta(payload)).toBe(false);
        expect(parseVersionMeta(payload)).toBeNull();
    });
});
