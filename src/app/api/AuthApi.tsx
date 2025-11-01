import apiClient from "@/lib/ApiClient";
import {Endpoints} from "@/app/api/Endpoints";

const login = async (user) => {
    try {
        const response = await apiClient.post(`${Endpoints.NEXT_PUBLIC_API_URL}/users/login`, user);
        return response.data;
    } catch (error) {
        console.error("Error logging in:", error);
        throw error;
    }
};

const refreshToken = async (body) => {
    try {
        const response = await apiClient.post(`${Endpoints.NEXT_PUBLIC_API_URL}/users/refresh-token`, body);
        return response.data;
    } catch (error) {
        console.error("Error logging in:", error);
        throw error;
    }
};

const findMe = async () => {
    try {
        const response = await apiClient.get(`${Endpoints.NEXT_PUBLIC_API_URL}/agent/me`);
        return response.data;
    } catch (error) {
        console.error("Error:", error);
        throw error;
    }
};

export const AuthApi = {
    login,
    refreshToken,
    findMe
};
