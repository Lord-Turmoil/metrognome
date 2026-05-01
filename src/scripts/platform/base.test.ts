import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import Api from '~/extensions/api';
import { fetchMeta, isNewerVersion } from '~/platform/base';

describe('platform base', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('returns success payload for valid app and version metadata', async () => {
        vi.spyOn(Api, 'fetch')
            .mockResolvedValueOnce({
                status: 'ok',
                data: {
                    latest: '1.4.6',
                    versions: ['1.4.6'],
                },
            })
            .mockResolvedValueOnce({
                status: 'ok',
                data: {
                    date: '2025-10-01',
                    changelog: [{ en: 'fix issue' }],
                    android: 'https://example.com/app.apk',
                },
            });

        const result = await fetchMeta();
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.appMeta.latest).toBe('1.4.6');
            expect(result.versionMeta.changelog).toHaveLength(1);
        }
    });

    it('maps app metadata network failures', async () => {
        vi.spyOn(Api, 'fetch').mockResolvedValueOnce({ status: 'network-error' });

        const result = await fetchMeta();
        expect(result).toEqual({
            ok: false,
            reason: 'app-meta-network-error',
            httpStatus: undefined,
        });
    });

    it('maps version metadata invalid-json failures with http status context', async () => {
        vi.spyOn(Api, 'fetch')
            .mockResolvedValueOnce({
                status: 'ok',
                data: {
                    latest: '1.4.6',
                    versions: ['1.4.6'],
                },
            })
            .mockResolvedValueOnce({
                status: 'invalid-json',
                httpStatus: 200,
            });

        const result = await fetchMeta();
        expect(result).toEqual({
            ok: false,
            reason: 'version-meta-invalid-json',
            httpStatus: 200,
        });
    });

    it('maps invalid app metadata payload', async () => {
        vi.spyOn(Api, 'fetch').mockResolvedValueOnce({
            status: 'ok',
            data: {
                latest: 1,
                versions: ['1.4.6'],
            },
        });

        const result = await fetchMeta();
        expect(result).toEqual({ ok: false, reason: 'app-meta-invalid' });
    });

    it('compares semantic versions correctly', () => {
        expect(isNewerVersion('1.4.5', '1.4.6')).toBe(true);
        expect(isNewerVersion('1.4.6', '1.4.6')).toBe(false);
        expect(isNewerVersion('1.5.0', '1.4.6')).toBe(false);
        expect(isNewerVersion('1.4', '1.4.1')).toBe(true);
        expect(isNewerVersion('1.4.6', '1.4')).toBe(false);
    });
});
