import apiClient from "@/lib/ApiClient";
import { Endpoints } from "@/app/api/Endpoints";

const endPoint = `${Endpoints.NEXT_PUBLIC_API_URL}/glasses-orders`;

export const GlassesApi = {
    getAll: () => {
        return apiClient.get(`${endPoint}/all`);
    },

    createOrder: (dto: any) => {
        return apiClient.post(`${endPoint}/create`, dto);
    },

    sendInvoice: (orderId, isOptic) => {
        return apiClient.post(`${endPoint}/send/${orderId}?isOptic=${isOptic}`);
    },

    markOrdersAsPaidByOptic: (opticId: number, orderIds: number[]) => {
        return apiClient.post(`${endPoint}/mark-optic-orders-paid/${opticId}`, orderIds);
    },



};
