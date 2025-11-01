import {Endpoints} from "@/app/api/Endpoints";
import apiClient from "@/lib/ApiClient";

const endPoint = `${Endpoints.NEXT_PUBLIC_API_URL}/admin`;

export const AdminApi = {
    deliverOrder: (orderId: number, allPaid: boolean, paidAmount?: number) => {
        return apiClient.post(`${endPoint}/deliver/${orderId}`, null, {
            params: {
                allPaid,
                paidAmount
            }
        });
    },
    payOrder: (orderId: number, allPaid: boolean, paidAmount?: number) => {
        return apiClient.post(`${endPoint}/paye/${orderId}`, null, {
            params: {
                allPaid,
                paidAmount
            }
        });
    },
    generateOpticInvoice: (orderId: number) => {
        return apiClient.post(`${endPoint}/optic-invoice/${orderId}`);
    },
    sendDeliverInvoice: (orderId) => {
        return apiClient.post(`${endPoint}/deliver-invoice/${orderId}`);
    },
    sendPayInvoice: (orderId) => {
        return apiClient.post(`${endPoint}/pay-invoice/${orderId}`);
    },

    getInvoice: (orderId: number) => {
        return apiClient.get(`${endPoint}/imprime/${orderId}`);
    },
    uploadDhlTracking: (formData: FormData) => {
        return apiClient.post(`${endPoint}/tracking/dhl/upload`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    },
    getCounter: () => {
        return apiClient.get(`${endPoint}/counter`);
    },

    findMe : () => {
            return  apiClient.get(`${endPoint}/me`);
    }

};
