import apiClient from "@/lib/ApiClient";
import {Endpoints} from "@/app/api/Endpoints";

const endPoint = `${Endpoints.NEXT_PUBLIC_API_URL}/admin/`;


const getAllOptics = () => {
    return apiClient.get(`${endPoint}optics/all`);
};


const toggleAutoValidate = (id: number, autoValidate: boolean) => {
    return apiClient.put(`${endPoint}optics/${id}/auto-validate?autoValidate=${autoValidate}`);
};


const validateGlassesOrder = (orderId: number, paidAmount: number, totalPrice: number) => {
    return apiClient.post(`${endPoint}validate-order/${orderId}?paidAmount=${paidAmount}&totalPrice=${totalPrice}`);
};

const activeOptic = (opticId: number) => {
    return apiClient.post(`${endPoint}active-optic/${opticId}`);
};

const deactivateOptic = (id: number) => {
    return apiClient.put(`${endPoint}deactivate-optic/${id}`);
};


export const OpticApi = {
    getAllOptics,
    toggleAutoValidate,
    validateGlassesOrder,
    activeOptic,
    deactivateOptic,
};
