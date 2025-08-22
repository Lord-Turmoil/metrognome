export type ResponseState = 'ok' | 'network-error' | 'server-error';
export type ApiResponse = {
    status: ResponseState;
    data: any;
};

class Api {
    private readonly baseUrl: string = import.meta.env.VITE_BASE_URL || 'http://localhost:3000';

    async fetch(url: string): Promise<ApiResponse> {
        if (!url.startsWith('/')) {
            url = '/' + url; // Ensure the URL starts with a slash
        }
        url = this.baseUrl + url; // Prepend the base URL
        const response: ApiResponse = await fetch(url, { cache: 'no-store' })
            .then((response) => {
                if (!response.ok) {
                    return { status: 'server-error' } as ApiResponse;
                }
                return { status: 'ok', data: response.json() } as ApiResponse;
            })
            .catch(() => {
                return { status: 'network-error' } as ApiResponse;
            });
        if (response.status === 'ok') {
            response.data = await response.data;
        }
        return response;
    }
}

export default new Api();
