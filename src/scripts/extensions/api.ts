export type ResponseState = 'ok' | 'network-error' | 'server-error' | 'invalid-json';
export type ApiSuccessResponse<T> = {
    status: 'ok';
    data: T;
};

export type ApiErrorResponse = {
    status: Exclude<ResponseState, 'ok'>;
    httpStatus?: number;
};

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

class Api {
    private readonly baseUrl: string = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

    async fetch<T>(url: string): Promise<ApiResponse<T>> {
        const resolvedUrl = this.resolveUrl(url);

        let response: Response;
        try {
            response = await fetch(resolvedUrl, { cache: 'no-store' });
        } catch {
            return { status: 'network-error' };
        }

        if (!response.ok) {
            return { status: 'server-error', httpStatus: response.status };
        }

        try {
            const data = (await response.json()) as T;
            return { status: 'ok', data };
        } catch {
            return { status: 'invalid-json', httpStatus: response.status };
        }
    }

    private resolveUrl(url: string): string {
        const normalizedUrl = url.startsWith('/') ? url : `/${url}`;
        return `${this.baseUrl}${normalizedUrl}`;
    }
}

export default new Api();
