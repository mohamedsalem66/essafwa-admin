import apiClient from "@/lib/ApiClient";
import { Endpoints } from "@/app/api/Endpoints";

const endPoint = `${Endpoints.NEXT_PUBLIC_API_URL}/admin/`;


const getAllCabinet = () => {
    return apiClient.get(`${endPoint}orders`);
};





export const CabinetApi = {
    getAllCabinet
};
