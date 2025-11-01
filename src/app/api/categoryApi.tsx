import apiClient from "@/lib/ApiClient";
import { Endpoints } from "@/app/api/Endpoints";

const endPoint = `${Endpoints.NEXT_PUBLIC_API_URL}/categories/`;


const getAll = () => {
    return apiClient.get(`${endPoint}all`);
};


const getAllExist = () => {
    return apiClient.get(`${endPoint}all-exist`);
};



export const CategoryApi = {
    getAll,
    getAllExist
};
