import apiClient from "@/lib/ApiClient";
import { Endpoints } from "@/app/api/Endpoints";

const endPoint = `${Endpoints.NEXT_PUBLIC_API_URL}/admin/`;
const endPointAgent = `${Endpoints.NEXT_PUBLIC_API_URL}/agent/`;


const getAllOrders = () => {
    return apiClient.get(`${endPoint}orders`);
};

const getCountOrders = () => {
    return apiClient.get(`${endPoint}count-by-status`);
};

const getAllCabinet = () => {
    return apiClient.get(`${endPoint}cabinets`);
};

const getOrdersByCabinetId = (cabinetId) => {
    return apiClient.get(`${endPoint}orders/${cabinetId}`);
}

const updateOrderStatus = (endpoint) => {
    return apiClient.get(`${endPoint}${endpoint}`);
}

const addPrescription =(orderId: number, prescription: any) => {
    return apiClient.put(`${endPoint}order/prescription/${orderId}`,prescription)
}

const getPrescriptionsByOrderId =(orderId: number) => {
    return apiClient.get(`${endPoint}prescriptions/${orderId}`)
}

const updateContactedStatus =(orderId: number) => {
    return apiClient.post(`${endPoint}contacted/${orderId}`)
}

const updateOrderNote =(orderId: number, body: any) => {
    return apiClient.post(`${endPoint}note/${orderId}`, body)
}

const addToCnam =(orderId: number, body: any) => {
    return apiClient.post(`${endPoint}cnam/${orderId}`, body)
}

const createPatient =(body: any) => {
    return apiClient.post(`${endPointAgent}create-patient`, body)
}




export const OrderApi = {
    getAllOrders,
    getCountOrders,
    getAllCabinet,
    getOrdersByCabinetId,
    updateOrderStatus,
    addPrescription,
    getPrescriptionsByOrderId,
    updateContactedStatus,
    updateOrderNote,
    addToCnam,
    createPatient
};
