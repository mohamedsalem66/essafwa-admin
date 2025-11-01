import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import {Endpoints} from "@/app/api/Endpoints";

interface ApiClientInstance extends AxiosInstance {
    setOnUnauthorizedCallback: (callback: () => void) => void;
}

let onUnauthorizedCallback: () => void;

const apiClient: ApiClientInstance = axios.create({
    baseURL: Endpoints.NEXT_PUBLIC_API_URL,
}) as ApiClientInstance;

apiClient.interceptors.request.use(
    async (config: AxiosRequestConfig) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            if (!config.headers) {
                config.headers = {};
            }
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor to handle 401 responses and remove the expired token
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    (error) => {
        if (error.response && error.response.status === 401) {
            localStorage.removeItem('access_token');

            if (onUnauthorizedCallback) {
                onUnauthorizedCallback();
            }
        }
        return Promise.reject(error);
    }
);

apiClient.setOnUnauthorizedCallback = (callback: () => void) => {
    onUnauthorizedCallback = callback;
};

export default apiClient;
