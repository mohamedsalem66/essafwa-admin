import apiClient from "@/lib/ApiClient";
import { Endpoints } from "@/app/api/Endpoints";

const endPoint = `${Endpoints.NEXT_PUBLIC_API_URL}/elemana-orders`;

export const EssafwaOrderApi = {
    getAll: () => {
        return apiClient.get(`${endPoint}`);
    },

    createOrder: (dto: any) => {
        return apiClient.post(`${endPoint}/create`, dto);
    },

    updateOrder: (id: number, dto: any) => {
        return apiClient.put(`${endPoint}/update/${id}`, dto);
    },

    deleteOrder: (id: number) => {
        return apiClient.delete(`${endPoint}/delete/${id}`);
    },

    getInvoice: (orderId: number) => {
        return apiClient.get(`${endPoint}/print/${orderId}`);
    },


    sendInvoice: (orderId: number) => {
        return apiClient.post(`${endPoint}/send/${orderId}`);
    },
    payOrder: (orderId: number, allPaid: boolean, paidAmount?: number) => {
        return apiClient.post(`${endPoint}/paye/${orderId}`, null, {
            params: {
                allPaid,
                paidAmount
            }
        });
    }
};
