import apiClient from "@/lib/ApiClient";
import { Endpoints } from "@/app/api/Endpoints";

const endPoint = `${Endpoints.NEXT_PUBLIC_API_URL}/firebase/`;


const getAllFolders = (path: string) => {
    return apiClient.get(`${endPoint}folders-in-path?folderPath=${path}`);
};

const getAllFiles = (path: string) => {
    return apiClient.get(`${endPoint}files-in-folder?filePath=${path}`);
};

const createFolder = (path: string) => {
    return apiClient.post(`${endPoint}create-folder?folderPath=${path}`);
};






export const FireBase = {
    getAllFolders,
    getAllFiles,
    createFolder
};
