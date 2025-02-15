/**
 * @module api
 * All the API calls to the server.
 */

import { BASE_URL } from "./private";

const RESPONSE_OK = 200;
const RESPONSE_NETWORK_ERROR = 0;
const RESPONSE_SERVER_ERROR = 500;

class Api {
    constructor() {
        this.baseUrl = BASE_URL;
        this.connected = false;
        this.connectivityListeners = [];
    }

    static isOk(response) {
        return response.status === RESPONSE_OK;
    }

    static isNetworkError(response) {
        return response.status === RESPONSE_NETWORK_ERROR;
    }

    static isServerError(response) {
        return response.status === RESPONSE_SERVER_ERROR;
    }

    setConnected(connected) {
        this.connected = connected;
        this.notifyAll();
    }

    getConnected() {
        return this.connected;
    }

    async request(url) {
        const response = await fetch(url, { cache: "no-store" })
            .then(response => {
                if (!response.ok) {
                    return { status: RESPONSE_SERVER_ERROR, error: response.statusText };
                }
                return { status: RESPONSE_OK, "data": response.json() };
            }).catch(error => {
                return { status: RESPONSE_NETWORK_ERROR, error: error };
            });
        if (Api.isOk(response)) {
            response.data = await response.data;
        }
        this.setConnected(!Api.isNetworkError(response));
        return response;
    }

    addConnectivityListener(listener) {
        this.connectivityListeners.push(listener);
    }

    notifyAll() {
        this.connectivityListeners.forEach(listener => { listener(this.connected); });
    }

    /**
     * Get the latest meta information of the app.
     * @returns {Promise} The promise that resolves with the meta information.
     * @throws {Error} If the request fails.
     */
    async getMeta() {
        var response = await this.request(`${this.baseUrl}/meta.json`);
        if (!Api.isOk(response)) {
            return Promise.resolve(response);
        }
        const latestVersion = response.data.latest;
        response = await this.request(`${this.baseUrl}/${latestVersion}/meta.json`);
        if (!Api.isOk(response)) {
            return Promise.resolve(response);
        }
        return Promise.resolve(response);
    }
};

export { Api };