"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import React, { useEffect, useState } from "react";
import { FaFolder, FaFileImage, FaArrowLeft } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";
import { FireBase } from "@/app/api/FireBaseApi";

type Image = {
    name: string;
    downloadUrl: string;
    size: number;
    contentType: string;
};

export default function FoldersManagement() {
    const [currentPath, setCurrentPath] = useState<string>("");
    const [folders, setFolders] = useState<string[]>([]);
    const [subfolders, setSubfolders] = useState<string[]>([]);
    const [images, setImages] = useState<Image[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [viewMode, setViewMode] = useState<"root" | "folder" | "subfolder">("root");

    useEffect(() => {
        fetchRootFolders();
    }, []);

    const fetchRootFolders = async () => {
        setIsLoading(true);
        try {
            const response = await FireBase.getAllFolders("glasses/");
            setFolders(response.data);
            setViewMode("root");
        } catch {
        } finally {
            setIsLoading(false);
        }
    };

    const fetchFolderContents = async (folderPath: string) => {
        setIsLoading(true);
        try {
            // First check for subfolders
            const subfoldersResponse = await FireBase.getAllFolders(folderPath);
            setSubfolders(subfoldersResponse.data);

            if (subfoldersResponse.data.length > 0) {
                setViewMode("folder");
            } else {
                // If no subfolders, check for images
                const imagesResponse = await FireBase.getAllFiles(folderPath);
                setImages(imagesResponse.data);
                setViewMode("subfolder");
            }
        } catch {
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSubfolderImages = async (subfolderPath: string) => {
        setIsLoading(true);
        try {
            const response = await FireBase.getAllFiles(subfolderPath);
            setImages(response.data);
            setViewMode("subfolder");
        } catch {
        } finally {
            setIsLoading(false);
        }
    };

    const handleFolderClick = (folderPath: string) => {
        setCurrentPath(folderPath);
        fetchFolderContents(folderPath);
    };

    const handleSubfolderClick = (subfolderPath: string) => {
        setCurrentPath(subfolderPath);
        fetchSubfolderImages(subfolderPath);
    };

    const navigateBack = () => {
        if (viewMode === "subfolder") {
            setViewMode("folder");
            setImages([]);
        } else if (viewMode === "folder") {
            setViewMode("root");
            setSubfolders([]);
            setCurrentPath("");
        }
    };


    console.log(currentPath)
    const createFolder = async () => {
        if (viewMode !== "folder") return;

        const newFolderName = prompt("Enter the name of the new folder:");
        if (newFolderName) {
            const folderPath = `${currentPath}${newFolderName}/`;
            try {
                await FireBase.createFolder(folderPath);
                fetchFolderContents(currentPath); // Refresh current folder contents
            } catch {
                alert("Error creating folder");
            }
        }
    };

    const createImage = async () => {
        if (viewMode !== "subfolder") return;

        const fileInput = document.createElement("input");
        fileInput.type = "file";
        fileInput.accept = "image/*";

        fileInput.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                setIsLoading(true);
                try {
                    await FireBase.uploadFile(currentPath, file);
                    fetchSubfolderImages(currentPath); // Refresh current subfolder images
                } catch {
                    alert("Error uploading image");
                } finally {
                    setIsLoading(false);
                }
            }
        };

        fileInput.click();
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const renderBreadcrumbs = () => {
        const parts = currentPath.split("/").filter(part => part && part !== "glasses");
        return (
            <div className="flex items-center gap-2 mb-6 text-sm text-gray-500 dark:text-gray-400">
                <button
                    onClick={navigateBack}
                    disabled={viewMode === "root"}
                    className="flex items-center gap-1 disabled:cursor-not-allowed disabled:opacity-50 hover:text-indigo-600"
                >
                    <FaArrowLeft /> Back
                </button>
                <span>glasses</span>
                {parts.map((part, index) => (
                    <React.Fragment key={index}>
                        <span>/</span>
                        <span>{part}</span>
                    </React.Fragment>
                ))}
            </div>
        );
    };

    const renderEmptyState = () => {
        if (viewMode === "folder") {
            return (
                <div className="flex flex-col items-center justify-center col-span-full py-12">
                    <FaFolder className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-500 mb-2">No subfolders found</p>
                    <p className="text-sm text-gray-400 mb-4">This folder is empty</p>
                    <button
                        onClick={createFolder}
                        className="inline-flex items-center gap-2 rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
                    >
                        <FiPlus /> Create Folder
                    </button>
                </div>
            );
        } else if (viewMode === "subfolder") {
            return (
                <div className="flex flex-col items-center justify-center col-span-full py-12">
                    <FaFileImage className="w-16 h-16 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-500 mb-2">No images found</p>
                    <p className="text-sm text-gray-400 mb-4">Upload images to this folder</p>
                    <button
                        onClick={createImage}
                        className="inline-flex items-center gap-2 rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
                    >
                        <FiPlus /> Add Image
                    </button>
                </div>
            );
        }
        return null;
    };

    return (
        <div>
            <PageBreadcrumb pageTitle="Folders Management" />
            <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-12">
                {renderBreadcrumbs()}

                {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                            {viewMode === "root" && folders.map((folder, index) => (
                                <div
                                    key={index}
                                    onDoubleClick={() => handleFolderClick(folder)}
                                    className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.03] group"
                                >
                                    <FaFolder className="w-10 h-10 text-indigo-600 group-hover:text-indigo-700" />
                                    <p className="mt-2 text-center">{folder.split('/')[1]}</p>
                                </div>
                            ))}

                            {viewMode === "folder" && (
                                subfolders.length > 0 ? (
                                    subfolders.map((subfolder, index) => (
                                        <div
                                            key={index}
                                            onDoubleClick={() => handleSubfolderClick(subfolder)}
                                            className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/[0.03] group"
                                        >
                                            <FaFolder className="w-10 h-10 text-indigo-600 group-hover:text-indigo-700" />
                                            <p className="mt-2 text-center">{subfolder.split('/').slice(-2, -1)[0]}</p>
                                        </div>
                                    ))
                                ) : (
                                    renderEmptyState()
                                )
                            )}

                            {viewMode === "subfolder" && (
                                images.length > 0 ? (
                                    images.map((image, index) => (
                                        <div
                                            key={index}
                                            className="flex flex-col p-4 border border-gray-200 rounded-lg dark:border-gray-700 bg-white hover:shadow-md transition-shadow"
                                        >
                                            <div className="relative aspect-square overflow-hidden rounded-lg mb-3 bg-gray-100">
                                                <img
                                                    src={image.downloadUrl}
                                                    alt={image.name.split("/").pop()}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23EEE'/%3E%3Ctext x='50%' y='50%' font-family='sans-serif' font-size='12' text-anchor='middle' dominant-baseline='middle' fill='%23AAA'%3EImage not found%3C/text%3E%3C/svg%3E";
                                                    }}
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium truncate mb-1">
                                                    {image.name.split("/").pop()}
                                                </p>
                                                <p className="text-xs text-gray-500 mb-1">{formatFileSize(image.size)}</p>
                                                <div className="text-xs text-gray-400 truncate w-full">
                          <span className="inline-block max-w-full truncate">
                            {image.downloadUrl}
                          </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    renderEmptyState()
                                )
                            )}
                        </div>

                        <div className="mt-6 flex gap-3">
                            {viewMode === "folder" && (
                                <button
                                    onClick={createFolder}
                                    className="inline-flex items-center gap-2 rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    <FiPlus /> Create Folder
                                </button>
                            )}

                            {(viewMode === "subfolder" && viewMode !== "folder") && (
                                <button
                                    onClick={createImage}
                                    className="inline-flex items-center gap-2 rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                                >
                                    <FiPlus /> Add Image
                                </button>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
