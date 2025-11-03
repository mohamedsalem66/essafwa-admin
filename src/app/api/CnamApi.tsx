import apiClient from "@/lib/ApiClient";
import { Endpoints } from "@/app/api/Endpoints";

const endPoint = `${Endpoints.NEXT_PUBLIC_API_URL}/cnam-orders`;

export const CnamApi = {
    // Get all CNAM orders (ADMIN only)
    getAll: () => {
        return apiClient.get(`${endPoint}`);
    },

    // Create a new CNAM order (ADMIN or OPTIC)
    createOrder: (dto: any) => {
        return apiClient.post(`${endPoint}/create`, dto);
    },

    // Update an existing CNAM order (OPTIC only)
    updateOrder: (id: number, dto: any) => {
        return apiClient.put(`${endPoint}/update/${id}`, dto);
    },

    // Delete a CNAM order (OPTIC only)
    deleteOrder: (id: number) => {
        return apiClient.delete(`${endPoint}/delete/${id}`);
    },

    // Get invoice PDF for a CNAM order (ADMIN only)
    getInvoice: (orderId: number) => {
        return apiClient.get(`${endPoint}/print/${orderId}`);
    },

    getCard: (orderId: number) => {
        return apiClient.get(`${endPoint}/print-card/${orderId}`);
    }
};
