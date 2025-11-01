import apiClient from "@/lib/ApiClient";
import { Endpoints } from "@/app/api/Endpoints";

export interface MarketingDTO {
    id?: number;
    title: string;
    message: string;         // French message
    arabicMessage: string;   // Arabic message
}


const createMarketing = async (marketing: MarketingDTO) => {
    const response = await apiClient.post(`${Endpoints.NEXT_PUBLIC_API_URL}/marketing/create`, marketing);
    return response.data;
};

const getAllMarketing = async (): Promise<MarketingDTO[]> => {
    const response = await apiClient.get(`${Endpoints.NEXT_PUBLIC_API_URL}/marketing/all`);
    return response.data;
};

const getMarketingById = async (id: number): Promise<MarketingDTO> => {
    const response = await apiClient.get(`${Endpoints.NEXT_PUBLIC_API_URL}/marketing/${id}`);
    return response.data;
};

const updateMarketing = async (id: number | undefined, marketing: MarketingDTO): Promise<MarketingDTO> => {
    const response = await apiClient.put(`${Endpoints.NEXT_PUBLIC_API_URL}/marketing/update/${id}`, marketing);
    return response.data;
};

const deleteMarketing = async (id: number | undefined): Promise<void> => {
    await apiClient.delete(`${Endpoints.NEXT_PUBLIC_API_URL}/marketing/delete/${id}`);
};

export const MarketingApi = {
    createMarketing,
    getAllMarketing,
    getMarketingById,
    updateMarketing,
    deleteMarketing,
};
