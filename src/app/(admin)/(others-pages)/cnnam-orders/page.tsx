"use client";
import React, {useEffect, useState} from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import {useTranslation} from "react-i18next";
import {AnimatePresence, motion} from "framer-motion";
import {CnamApi} from "@/app/api/CnamApi";
import {CategoryApi} from "@/app/api/categoryApi";
import Switch from "@/components/form/switch/Switch";
import { toast } from "react-toastify";
import {AdminApi} from "@/app/api/AdminApi";
import {UserIcon} from "@/icons";
import CategorySelect from "@/components/CategorySelect";
import { HiOutlinePrinter } from "react-icons/hi";
import BackToMenu from "@/components/common/BackToMenu";

interface CnamOrder {
    id: number;
    clientName: string;
    clientTel: string;
    rightSphere: string;
    rightCylinder: string;
    rightAxis: number;
    rightAddition: string;
    leftSphere: string | null;
    leftCylinder: string | null;
    leftAxis: number | null;
    leftAddition: string | null;
    category: {
        id: number;
        name: string;
        arabicName: string;
        isExpensive: boolean;
        amount: number;
        prepayAmount: number;
        hasAdd: boolean;
    };
    invoiceNumber: string;
    paidAmount: number;
    remainingAmount: number;
    totalPaidAmount: number;
    rightEye: boolean;
    leftEye: boolean;
    framePrice: number;
    createdAt: string;
}

interface Category {
    id: number;
    name: string;
    arabicName: string;
    isExpensive: boolean;
    amount: number;
    hasAdd : boolean;
}

interface NewOrderData {
    clientName: string;
    clientTel: string;
    rightSphere: string;
    rightCylinder: string;
    rightAxis: string;
    rightAddition: string;
    leftSphere: string;
    leftCylinder: string;
    leftAxis: string;
    leftAddition: string;
    categoryId: number;
    paidAmount: string;
    framePrice: string;
    rightEyeEnabled: boolean;
    leftEyeEnabled: boolean;
    totalPaidAmount?: number | null;
}

const sphereOptions = (() => {
    const options = [""];
    options.push("000");
    for (let i = 0.25; i <= 20.00; i += 0.25) {
        options.push(`+${i.toFixed(2)}`);
    }
    for (let i = 0.25; i <= 20.00; i += 0.25) {
        options.push(`-${i.toFixed(2)}`);
    }
    return options;
})();

const cylinderOptions = (() => {
    const options = [""];
    options.push("000");
    for (let i = 0.25; i <= 10.00; i += 0.25) {
        options.push(`-${i.toFixed(2)}`);
    }
    for (let i = 0.25; i <= 10.00; i += 0.25) {
        options.push(`+${i.toFixed(2)}`);
    }
    return options;
})();

const axisOptions = Array.from({ length: 181 }, (_, i) => i);
const additionOptions = ["","+0.50", "+0.75", "+1.00", "+1.25", "+1.50", "+1.75", "+2.00", "+2.25", "+2.50", "+2.75", "+3.00", "+3.25", "+3.50", "+3.75","+4.00", "+4.25", "+4.50", "+4.75", "+5.00"];

interface LoadingStates {
    [key: number]: boolean;
}

export default function CnamOrders() {
    const {t,i18n } = useTranslation();
    const isRTL = i18n.dir() === "rtl";
    const [orders, setOrders] = useState<CnamOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);
    const [isMobile, setIsMobile] = useState(false);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [creatingOrder, setCreatingOrder] = useState(false);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [newOrderData, setNewOrderData] = useState<NewOrderData>({
        clientName: "",
        clientTel: "",
        rightSphere: "",
        rightCylinder: "",
        rightAxis: "",
        rightAddition: "",
        leftSphere: "",
        leftCylinder: "",
        leftAxis: "",
        leftAddition: "",
        categoryId: 0,
        paidAmount: "",
        framePrice: "",
        rightEyeEnabled: true,
        leftEyeEnabled: true,
        totalPaidAmount: null
    });
    const [totalPaidAmount, setTotalPrice] = useState<string>("");
    const [totalPaidAmountError, setTotalPriceError] = useState<string>("");
    const [createErrors, setCreateErrors] = useState<Partial<NewOrderData>>({});
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [hasAddForNewCategory, setHasAddForNewCategory] = useState(false);
    const [loadingStates, setLoadingStates] = useState<LoadingStates>({});

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        fetchOrders();
        fetchCategories();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await CnamApi.getAll();
            const allOrders = response?.data || [];
            const sortedOrders = allOrders.sort((a: CnamOrder, b: CnamOrder) => b.id - a.id);
            setOrders(sortedOrders);
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCategories = async () => {
        try {
            const response = await CategoryApi.getAll();
            setCategories(response?.data || []);
        } catch (error) {
            console.error("Error fetching categories:", error);
        }
    };

    const openCreateModal = () => {
        setIsCreateModalOpen(true);
        setNewOrderData({
            clientName: "",
            clientTel: "",
            rightSphere: "",
            rightCylinder: "",
            rightAxis: "",
            rightAddition: "",
            leftSphere: "",
            leftCylinder: "",
            leftAxis: "",
            leftAddition: "",
            categoryId: 0,
            paidAmount: "",
            framePrice: "",
            rightEyeEnabled: true,
            leftEyeEnabled: true,
            totalPaidAmount: null,
        });
        setCreateErrors({});
        setCurrentStep(1);
    };

    const closeCreateModal = () => {
        setIsCreateModalOpen(false);
        resetForm();
        setCurrentStep(1);
    };

    const handleCreateOrder = async () => {
        if (!validateForm()) return;
        setCreatingOrder(true);
        try {
            const payload = {
                clientName: newOrderData.clientName ? newOrderData.clientName : "",
                clientTel: newOrderData.clientTel ? newOrderData.clientTel : "",
                paidAmount: Number(newOrderData.paidAmount),
                framePrice: Number(newOrderData.framePrice),
                totalPaidAmount: Number(newOrderData.paidAmount) + Number(newOrderData.framePrice),
                rightSphere: newOrderData.rightEyeEnabled ? newOrderData.rightSphere : "",
                rightCylinder: newOrderData.rightEyeEnabled ? newOrderData.rightCylinder : "",
                rightAxis: newOrderData.rightEyeEnabled && newOrderData.rightAxis ? Number(newOrderData.rightAxis) : null,
                rightAddition: newOrderData.rightEyeEnabled ? newOrderData.rightAddition : "",
                leftSphere: newOrderData.leftEyeEnabled ? newOrderData.leftSphere : null,
                leftCylinder: newOrderData.leftEyeEnabled ? newOrderData.leftCylinder : null,
                leftAxis: newOrderData.leftEyeEnabled && newOrderData.leftAxis ? Number(newOrderData.leftAxis) : null,
                leftAddition: newOrderData.leftEyeEnabled ? newOrderData.leftAddition : null,
                rightEye: newOrderData.rightEyeEnabled,
                leftEye: newOrderData.leftEyeEnabled,
                category: {
                    id: Number(newOrderData.categoryId)
                }
            };

            const response = await CnamApi.createOrder(payload);

            if (response) {
                await fetchOrders();
                await fetchCategories();
                closeCreateModal();
                setCreatingOrder(false);
                setIsSuccessModalOpen(true);
                resetForm();

                if (response.data && response.data.id) {
                    try {
                        await downloadInvoice(response.data.id);
                        await downloadCard(response.data.id);
                    } catch (printError) {
                        console.error("Failed to auto-print invoice:", printError);
                        // Don't show error to user as order was created successfully
                    }
                }
            } else {
                throw new Error('Failed to create order');
            }
        } catch (error) {
            console.error("Failed to create order:", error);
            toast.error(t("Failed to create order"));
        } finally {
            setCreatingOrder(false);
        }
    };

    const downloadInvoice = async (orderId: number) => {
        try {
            setLoadingStates(prev => ({ ...prev, [orderId]: true }));

            const response = await CnamApi.getInvoice(orderId);
            const pdfData = response.data;

            if (!pdfData?.fileSource) {
                throw new Error('Invalid PDF data received');
            }
            const base64Data = pdfData.fileSource.split(',')[1] || pdfData.fileSource;
            const byteCharacters = atob(base64Data);
            const byteArray = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteArray[i] = byteCharacters.charCodeAt(i);
            }
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = pdfData.fileName || `invoice_${orderId}.pdf`;
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);

        } catch (error) {
            console.error('Error downloading invoice:', error);
            alert('Failed to download invoice: ' + (error as Error).message);
        } finally {
            setLoadingStates(prev => ({ ...prev, [orderId]: false }));
        }
    };

    const downloadCard = async (orderId: number) => {
        try {
            setLoadingStates(prev => ({ ...prev, [orderId]: true }));

            const response = await CnamApi.getCard(orderId);
            const pdfData = response.data;

            if (!pdfData?.fileSource) {
                throw new Error('Invalid PDF data received');
            }
            const base64Data = pdfData.fileSource.split(',')[1] || pdfData.fileSource;
            const byteCharacters = atob(base64Data);
            const byteArray = new Uint8Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteArray[i] = byteCharacters.charCodeAt(i);
            }
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = pdfData.fileName || `invoice_${orderId}.pdf`;
            document.body.appendChild(link);
            link.click();

            setTimeout(() => {
                document.body.removeChild(link);
                URL.revokeObjectURL(url);
            }, 100);

        } catch (error) {
            console.error('Error downloading invoice:', error);
            alert('Failed to download invoice: ' + (error as Error).message);
        } finally {
            setLoadingStates(prev => ({ ...prev, [orderId]: false }));
        }
    };


    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        if (name === "categoryId") {
            const selectedCategory = categories.find(c => c.id === Number(value));
            if (selectedCategory && !selectedCategory.hasAdd) {
                newOrderData.leftAddition = "";
                newOrderData.rightAddition = "";
            }
        }

        setNewOrderData((prev) => ({ ...prev, [name]: value }));
    };

    const validateForm = () => {
        const selectedCategory = categories.find(c => c.id === Number(newOrderData.categoryId));
        const currentHasAdd = newOrderData.categoryId === -1 ? hasAddForNewCategory : selectedCategory?.hasAdd;

        const errors: any = {};

        if (!newOrderData.categoryId || newOrderData.categoryId === 0) {
            errors.categoryId = t("Category is required");
        }

        if (!newOrderData.paidAmount || isNaN(Number(newOrderData.paidAmount)) || Number(newOrderData.paidAmount) < 0) {
            errors.paidAmount = t("Verre price is required and must be a valid number");
        }

        if (!newOrderData.framePrice || isNaN(Number(newOrderData.framePrice)) || Number(newOrderData.framePrice) < 0) {
            errors.framePrice = t("Frame price is required and must be a valid number");
        }

        if (!newOrderData.clientName.trim()) errors.clientName = t("Client name is required");
        if (!newOrderData.clientTel.trim()) errors.clientTel = t("Client phone is required");

        if (newOrderData.rightCylinder && !newOrderData.rightAxis) {
            errors.rightAxis = t("Right axis is required when cylinder is selected");
        }
        if (newOrderData.rightAxis && !newOrderData.rightCylinder) {
            errors.rightCylinder = t("Right cylinder is required when axis is selected");
        }

        if (newOrderData.leftCylinder && !newOrderData.leftAxis) {
            errors.leftAxis = t("Left axis is required when cylinder is selected");
        }
        if (newOrderData.leftAxis && !newOrderData.leftCylinder) {
            errors.leftCylinder = t("Left cylinder is required when axis is selected");
        }

        if (newOrderData.rightEyeEnabled) {
            if (!newOrderData.rightSphere) {
                errors.rightSphere = t("Right sphere is required");
            }
            if (currentHasAdd && !newOrderData.rightAddition) {
                errors.rightAddition = t("Right addition is required");
            }
        }

        if (newOrderData.leftEyeEnabled) {
            if (!newOrderData.leftSphere) {
                errors.leftSphere = t("Left sphere is required");
            }
            if (currentHasAdd && !newOrderData.leftAddition) {
                errors.leftAddition = t("Left addition is required");
            }
        }

        setCreateErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const resetForm = () => {
        setNewOrderData({
            clientName: "",
            clientTel: "",
            rightSphere: "",
            rightCylinder: "",
            rightAxis: "",
            rightAddition: "",
            leftSphere: "",
            leftCylinder: "",
            leftAxis: "",
            leftAddition: "",
            categoryId: 0,
            paidAmount: "",
            framePrice: "",
            rightEyeEnabled: true,
            leftEyeEnabled: true,
            totalPaidAmount: null,
        });
        setCreateErrors({});
        setHasAddForNewCategory(false);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString("fr-FR", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const calculateTotalRemaining = () => {
        return orders.reduce((total, order) => total + order.remainingAmount, 0);
    };

    const toggleRowExpand = (id: number) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const filteredOrders = orders.filter((order) => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesClientName = order.clientName.toLowerCase().includes(query);
            const matchesOrderId = order.id.toString().includes(query);
            const matchesClientTel = order.clientTel?.includes(query) || false;
            const matchesInvoiceNumber = order.invoiceNumber?.toString().includes(query) || false;
            if (
                !matchesClientName &&
                !matchesOrderId &&
                !matchesClientTel &&
                !matchesInvoiceNumber
            ) {
                return false;
            }
        }
        return true;
    });

    const toggleEye = (eye: 'right' | 'left') => {
        setNewOrderData(prev => {
            const newValue = !prev[`${eye}EyeEnabled`];
            const otherEye = eye === 'right' ? 'leftEyeEnabled' : 'rightEyeEnabled';

            if (!newValue && !prev[otherEye]) {
                return prev;
            }

            const updatedData = {
                ...prev,
                [`${eye}EyeEnabled`]: newValue
            };

            if (!newValue) {
                if (eye === 'right') {
                    updatedData.rightSphere = "";
                    updatedData.rightCylinder = "";
                    updatedData.rightAxis = "";
                    updatedData.rightAddition = "";
                } else {
                    updatedData.leftSphere = "";
                    updatedData.leftCylinder = "";
                    updatedData.leftAxis = "";
                    updatedData.leftAddition = "";
                }
            }

            return updatedData;
        });
    };

    const modalVariants = {
        hidden: {opacity: 0, y: 50, scale: 0.95},
        visible: {opacity: 1, y: 0, scale: 1, transition: {type: "spring", damping: 25, stiffness: 500}},
        exit: {opacity: 0, y: 50, scale: 0.95, transition: {duration: 0.2}},
    };

    const overlayVariants = {
        hidden: {opacity: 0},
        visible: {opacity: 0.5},
        exit: {opacity: 0},
    };

    const bottomSheetVariants = {
        hidden: {y: "100%"},
        visible: {y: 0, transition: {type: "spring", damping: 25, stiffness: 500}},
        exit: {y: "100%", transition: {duration: 0.3}},
    };

    return (
        <div className="md:p-1">
            <BackToMenu />
            <div className="mb-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                            {t("CNAM Orders")} ({filteredOrders.length})
                        </h1>
                        <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-5 w-5 text-red-600 dark:text-red-400"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path
                                    fillRule="evenodd"
                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                                    clipRule="evenodd"
                                />
                            </svg>
                            <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                -{calculateTotalRemaining().toFixed(0)} MRU
                            </span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                            placeholder={t("Search by Client Name, Phone, or Order ID")}
                            defaultValue={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <Button onClick={openCreateModal} size="sm" className="md:w-auto w-full">
                            {t("Create New Order")}
                        </Button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    {t("No orders found")}
                </div>
            ) : isMobile ? (
                <div className="space-y-4">
                    {filteredOrders.map((order) => (
                        <div
                            key={order.id}
                            className="rounded-lg shadow-md bg-white dark:bg-gray-800"
                        >
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col">
                                        <h3 className="font-medium text-gray-800 dark:text-white">
                                            #{order.invoiceNumber}
                                        </h3>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                            {formatDate(order.createdAt)}
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <p className="text-gray-800 dark:text-gray-400">{t("Category")}:</p>
                                        <p>{order?.category?.name}</p>
                                    </div>
                                    {order.clientTel && <p><span
                                        className="text-gray-800 dark:text-gray-400">{t("Client Number")}:</span> {order.clientTel}
                                    </p>}
                                </div>

                                <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                                    <div>
                                        <p className="text-gray-800 dark:text-gray-400">{t("Total")}:</p>
                                        <p>{order?.totalPaidAmount} MRU</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-800 dark:text-gray-400">{t("Paid")}:</p>
                                        <p className="text-green-600 dark:text-green-400">{order?.paidAmount || 0} MRU</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-800 dark:text-gray-400">{t("Remaining")}:</p>
                                        <p className="text-red-600 dark:text-red-400">{order?.remainingAmount} MRU</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-4 mt-4">
                                    {order?.rightEye && <div>
                                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">{t("Right Eye")}</h4>
                                        <div className="space-y-1 text-sm">
                                            <p><span
                                                className="text-gray-800 dark:text-gray-400">Sphere:</span> {order.rightSphere}
                                            </p>
                                            {order?.rightCylinder ? <p><span
                                                className="text-gray-800 dark:text-gray-400">Cylinder:</span> {order.rightCylinder}
                                            </p> : <p>-</p>}
                                            {order?.rightAxis ? <p><span
                                                className="text-gray-800 dark:text-gray-400">Axe:</span> {order?.rightAxis ? order?.rightAxis + "°" : " "}
                                            </p> : <p>-</p>}
                                            {order?.rightAddition && <p><span
                                                className="text-gray-800 dark:text-gray-400">Addition:</span> {order.rightAddition}
                                            </p>}
                                        </div>
                                    </div>}
                                    {order?.leftEye && <div>
                                        <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">{t("Left Eye")}</h4>
                                        <div className="space-y-1 text-sm">
                                            <p><span
                                                className="text-gray-800 dark:text-gray-400">Sphere:</span> {order.leftSphere}
                                            </p>
                                            {order?.leftCylinder ? <p><span
                                                className="text-gray-800 dark:text-gray-400">Cylinder:</span> {order.leftCylinder}
                                            </p> : <p>-</p>}
                                            {order?.leftAxis ? <p><span
                                                className="text-gray-800 dark:text-gray-400">Axe:</span> {order?.leftAxis && order.leftAxis + "°"}
                                            </p> : <p>-</p>}
                                            {order?.leftAddition && <p><span
                                                className="text-gray-800 dark:text-gray-400">Addition:</span> {order.leftAddition}
                                            </p>}
                                        </div>
                                    </div>}
                                </div>

                                <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            downloadInvoice(order.id!);
                                                            downloadCard(order.id!)
                                                        }}
                                                        title="Télécharger la facture"
                                                        disabled={loadingStates[order.id!]}
                                                        className={`text-gray-600 hover:text-[#961767] transition duration-150`}
                                                    >
                                                        {loadingStates[order.id!] ? (
                                                            <div className="relative w-8 h-8">
                                                                <svg
                                                                    className="animate-spin h-full w-full text-[#961767]"
                                                                    viewBox="0 0 24 24"
                                                                >
                                                                    <circle
                                                                        className="opacity-15"
                                                                        cx="12"
                                                                        cy="12"
                                                                        r="10"
                                                                        stroke="currentColor"
                                                                        strokeWidth="4"
                                                                        fill="none"
                                                                    />
                                                                    <path
                                                                        className="opacity-75"
                                                                        fill="none"
                                                                        stroke="currentColor"
                                                                        strokeWidth="4"
                                                                        strokeLinecap="round"
                                                                        strokeDasharray="80"
                                                                        strokeDashoffset="60"
                                                                        d="M12 2a10 10 0 0 1 10 10"
                                                                    />
                                                                </svg>
                                                                <div
                                                                    className="absolute inset-0 flex items-center justify-center">
                                                                    <div
                                                                        className="w-1 h-1 bg-[#961767] rounded-full"></div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <HiOutlinePrinter
                                                                className="w-8 h-8 transition-transform hover:scale-110 hover:text-[#961767]"/>
                                                        )}
                                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-800">
                        <tr>
                            <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'}  ${isRTL ? 'text-m' : 'text-xs'} font-medium text-gray-800 dark:text-gray-400 uppercase tracking-wider`}>
                                {t("ID")}
                            </th>
                            <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'text-m' : 'text-xs'}  font-medium text-gray-800 dark:text-gray-400 uppercase tracking-wider`}>
                                {t("Client")}
                            </th>
                            <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'text-m' : 'text-xs'} font-medium text-gray-800 dark:text-gray-400 uppercase tracking-wider`}>
                                {t("Total")}
                            </th>
                            <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'text-m' : 'text-xs'} font-medium text-gray-800 dark:text-gray-400 uppercase tracking-wider`}>
                                {t("Paid Amount")}
                            </th>
                            <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'text-m' : 'text-xs'} font-medium text-gray-800 dark:text-gray-400 uppercase tracking-wider`}>
                                {t("Remaining")}
                            </th>
                            <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'text-m' : 'text-xs'} font-medium text-gray-800 dark:text-gray-400 uppercase tracking-wider`}>
                                {t("Created At")}
                            </th>
                            <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'text-m' : 'text-xs'} font-medium text-gray-800 dark:text-gray-400 uppercase tracking-wider`}>
                                {t("Actions")}
                            </th>
                            <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'text-m' : 'text-s'} font-medium text-gray-800 dark:text-gray-400 uppercase tracking-wider`}></th>
                        </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredOrders.map((order) => (
                            <React.Fragment key={order.id}>
                                <tr
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                                    onClick={() => toggleRowExpand(order.id)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                        #{order.invoiceNumber}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-m text-gray-800 dark:text-gray-400">
                                        {order.clientName}
                                        {order.clientTel && <div className="text-sm text-gray-500">{order.clientTel}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-400">
                                        {order.totalPaidAmount != null ? `${order.totalPaidAmount} MRU` : '---'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                                        {order.paidAmount != null ? `${order.paidAmount} MRU` : '---'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                                        {order.remainingAmount != null ? `${order.remainingAmount} MRU` : '---'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(order.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    downloadInvoice(order.id!);
                                                    downloadCard(order.id!);
                                                }}
                                                title="Télécharger la facture"
                                                disabled={loadingStates[order.id!]}
                                                className={`text-gray-600 hover:text-[#961767] transition duration-150 ${isRTL ? "mr-6" : "ml-6"}`}
                                            >
                                                {loadingStates[order.id!] ? (
                                                    <div className="relative w-8 h-8">
                                                        <svg
                                                            className="animate-spin h-full w-full text-[#961767]"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <circle
                                                                className="opacity-15"
                                                                cx="12"
                                                                cy="12"
                                                                r="10"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                                fill="none"
                                                            />
                                                            <path
                                                                className="opacity-75"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="4"
                                                                strokeLinecap="round"
                                                                strokeDasharray="80"
                                                                strokeDashoffset="60"
                                                                d="M12 2a10 10 0 0 1 10 10"
                                                            />
                                                        </svg>
                                                        <div
                                                            className="absolute inset-0 flex items-center justify-center">
                                                            <div
                                                                className="w-1 h-1 bg-[#961767] rounded-full"></div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <HiOutlinePrinter
                                                        className="w-8 h-8 transition-transform hover:scale-110 hover:text-[#961767]"/>
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <svg
                                            className={`h-5 w-5 transform ${expandedRow === order.id ? "rotate-90" : ""}`}
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                                  d={isRTL ? "M15 19l-7-7 7-7" : "M9 5l7 7-7 7"}
                                            />
                                        </svg>
                                    </td>

                                </tr>
                                {expandedRow === order.id && (
                                    <tr className="bg-gray-50 dark:bg-gray-700">
                                        <td colSpan={10} className="px-6 py-4">
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">{t("Details")}</h4>
                                                    <div className="space-y-1 text-m">
                                                        <p>
                                                            <span
                                                                className="text-gray-800 dark:text-gray-400">{t("Client Name")}:</span> {order.clientName}
                                                        </p>
                                                        {order.clientTel && <p><span
                                                            className="text-gray-800 dark:text-gray-400">{t("Client Number")}:</span> {order.clientTel}
                                                        </p>}
                                                        <p><span
                                                            className="text-gray-800 dark:text-gray-400">{t("Category")} : </span> {order.category.name}
                                                        </p>
                                                        <p><span
                                                            className="text-gray-800 dark:text-gray-400">{t("Frame Price")} : </span> {order.framePrice} MRU
                                                        </p>
                                                        <p><span
                                                            className="text-gray-800 dark:text-gray-400">{t("Created At")} : </span> {formatDate(order.createdAt)}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-gray-700 dark:text-gray-300 mb-2">{t("Prescription")}</h4>
                                                    <div className="grid grid-cols-2 gap-2 text-m">
                                                        {order.rightEye && (
                                                            <div>
                                                                <h5 className="font-medium">{t("Right Eye")}</h5>
                                                                {order.rightSphere && (
                                                                    <p>
                                                                        <span className="text-gray-500 dark:text-gray-400">Sphere:</span> {order.rightSphere}
                                                                    </p>
                                                                )}
                                                                {order.rightCylinder ? (
                                                                    <p>
                                                                        <span className="text-gray-500 dark:text-gray-400">Cylinder:</span> {order.rightCylinder}
                                                                    </p>
                                                                ):  <p>-</p>}
                                                                {order.rightAxis ? (
                                                                    <p>
                                                                        <span className="text-gray-500 dark:text-gray-400">Axe:</span> {order.rightAxis}°
                                                                    </p>
                                                                ) :  <p>-</p>}
                                                                {order.rightAddition && (
                                                                    <p>
                                                                        <span className="text-gray-500 dark:text-gray-400">Addition:</span> {order.rightAddition}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                        {order.leftEye && (
                                                            <div>
                                                                <h5 className="font-medium">{t("Left Eye")}</h5>
                                                                {order.leftSphere && (
                                                                    <p>
                                                                        <span className="text-gray-500 dark:text-gray-400">Sphere:</span> {order.leftSphere}
                                                                    </p>
                                                                )}
                                                                {order.leftCylinder && (
                                                                    <p>
                                                                        <span className="text-gray-500 dark:text-gray-400">Cylinder:</span> {order.leftCylinder}
                                                                    </p>
                                                                )}
                                                                {order.leftAxis && (
                                                                    <p>
                                                                        <span className="text-gray-500 dark:text-gray-400">Axe:</span> {order.leftAxis}°
                                                                    </p>
                                                                )}
                                                                {order.leftAddition && (
                                                                    <p>
                                                                        <span className="text-gray-500 dark:text-gray-400">Addition:</span> {order.leftAddition}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}

            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-100 overflow-y-auto">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={overlayVariants}
                            className="fixed inset-0 bg-black"
                            onClick={() => setIsCreateModalOpen(false)}
                        />

                        <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-6">
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                variants={isMobile ? bottomSheetVariants : modalVariants}
                                className={`
          w-full bg-white dark:bg-gray-800 shadow-xl
          ${isMobile ? 'fixed bottom-0 left-0 right-0 max-h-[85vh] rounded-t-2xl overflow-y-auto' : 'relative max-w-lg rounded-lg max-h-[90vh] overflow-y-auto'}
        `}
                            >
                                <div className="sticky top-0 z-10 flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                        {currentStep === 1 ? t("Create New Order") : t("Verify Your Order")}
                                    </h3>
                                    <button
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                        </svg>
                                    </button>
                                </div>

                                <div className="p-4 space-y-4 overflow-y-auto">
                                    {currentStep === 1 ? (
                                        <>
                                            <div>
                                                <Label>{t("Client Name")} *</Label>
                                                <Input
                                                    name="clientName"
                                                    defaultValue={newOrderData.clientName}
                                                    onChange={handleInputChange}
                                                    placeholder={t("Enter client name")}
                                                    error={!!createErrors.clientName}
                                                />
                                                {createErrors.clientName && (
                                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                        {createErrors.clientName}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>{t("Client Number")} *</Label>
                                                <Input
                                                    name="clientTel"
                                                    defaultValue={newOrderData.clientTel}
                                                    onChange={handleInputChange}
                                                    placeholder={t("Enter client number")}
                                                    error={!!createErrors.clientTel}
                                                />
                                                {createErrors.clientTel && (
                                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                        {createErrors.clientTel}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>{t("Category")} *</Label>
                                                <CategorySelect
                                                    categories={categories}
                                                    value={newOrderData.categoryId}
                                                    onChange={(categoryId: number) => {
                                                        setNewOrderData(prev => ({
                                                            ...prev,
                                                            categoryId,
                                                        }));
                                                    }}
                                                    error={createErrors.categoryId}
                                                    onNewCategory={(name: string) => {
                                                        setNewOrderData(prev => ({
                                                            ...prev,
                                                        }));
                                                    }}
                                                />
                                                {createErrors.categoryId && (
                                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                        {createErrors.categoryId}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>{t("Verre Price")} *</Label>
                                                <Input
                                                    name="paidAmount"
                                                    defaultValue={newOrderData.paidAmount}
                                                    onChange={handleInputChange}
                                                    placeholder={t("Enter verre price")}
                                                    error={!!createErrors.paidAmount}
                                                />
                                                {createErrors.paidAmount && (
                                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                        {createErrors.paidAmount}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>{t("Frame Price")} *</Label>
                                                <Input
                                                    name="framePrice"
                                                    defaultValue={newOrderData.framePrice}
                                                    onChange={handleInputChange}
                                                    placeholder={t("Enter frame price")}
                                                    error={!!createErrors.framePrice}
                                                />
                                                {createErrors.framePrice && (
                                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                        {createErrors.framePrice}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div
                                                    className={`border p-4 rounded-lg ${newOrderData.rightEyeEnabled ? "bg-gray-50 dark:bg-gray-700" : "bg-gray-100 dark:bg-gray-800 opacity-70"}`}>
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h3 className={`font-medium ${newOrderData.rightEyeEnabled ? "text-gray-800 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                                                            {t("Right Eye")}
                                                        </h3>
                                                        <Switch
                                                            label={" "}
                                                            defaultChecked={newOrderData.rightEyeEnabled}
                                                            onChange={(checked) => toggleEye('right')}
                                                            disabled={!newOrderData.leftEyeEnabled && newOrderData.rightEyeEnabled}
                                                        />
                                                    </div>
                                                    <div
                                                        className={`space-y-3 ${!newOrderData.rightEyeEnabled ? "pointer-events-none" : ""}`}>
                                                        <div>
                                                            <Label
                                                            >{t("Sphere")} *</Label>
                                                            <select
                                                                name="rightSphere"
                                                                value={newOrderData.rightSphere}
                                                                onChange={handleInputChange}
                                                                disabled={!newOrderData.rightEyeEnabled}
                                                                className={`w-full rounded-md border ${createErrors.rightSphere ? "border-red-500" : "border-gray-300 dark:border-gray-600"} p-2 ${newOrderData.rightEyeEnabled ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}
                                                                required={newOrderData.rightEyeEnabled}
                                                            >
                                                                {sphereOptions.map((option) => (
                                                                    <option key={option} value={option}>
                                                                        {option === "" ? t("Select") : option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <Label>{t("Cylinder")}</Label>
                                                            <select
                                                                name="rightCylinder"
                                                                value={newOrderData.rightCylinder}
                                                                onChange={handleInputChange}
                                                                disabled={!newOrderData.rightEyeEnabled}
                                                                className={`w-full rounded-md border ${createErrors.rightCylinder ? "border-red-500" : "border-gray-300 dark:border-gray-600"} p-2 ${newOrderData.rightEyeEnabled ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}
                                                            >
                                                                {cylinderOptions.map((option) => (
                                                                    <option key={option} value={option}>
                                                                        {option === "" ? t("Select") : option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <Label
                                                            >{t("Axis")}</Label>
                                                            <select
                                                                name="rightAxis"
                                                                value={newOrderData.rightAxis}
                                                                onChange={handleInputChange}
                                                                disabled={!newOrderData.rightEyeEnabled}
                                                                className={`w-full rounded-md border ${createErrors.rightAxis ? "border-red-500" : "border-gray-300 dark:border-gray-600"} p-2 ${newOrderData.rightEyeEnabled ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}
                                                            >
                                                                <option value="">{t("Select")}</option>
                                                                {axisOptions.map((option) => (
                                                                    <option key={option} value={option}>
                                                                        {option}°
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        {(newOrderData.categoryId === -1 ? hasAddForNewCategory :
                                                            newOrderData.categoryId && categories.find(c => c.id === Number(newOrderData.categoryId))?.hasAdd) ? (
                                                            <div>
                                                                <Label
                                                                >{t("Addition")} *</Label>
                                                                <select
                                                                    name="rightAddition"
                                                                    value={newOrderData.rightAddition}
                                                                    onChange={handleInputChange}
                                                                    disabled={!newOrderData.rightEyeEnabled}
                                                                    className={`w-full rounded-md border ${createErrors.rightAddition ? "border-red-500" : "border-gray-300 dark:border-gray-600"} p-2 ${newOrderData.rightEyeEnabled ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}
                                                                    required={newOrderData.rightEyeEnabled}
                                                                >
                                                                    {additionOptions.map((option) => (
                                                                        <option key={option} value={option}>
                                                                            {option === "" ? t("Select") : option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>

                                                <div
                                                    className={`border p-4 rounded-lg ${newOrderData.leftEyeEnabled ? "bg-gray-50 dark:bg-gray-700" : "bg-gray-100 dark:bg-gray-800 opacity-70"}`}>
                                                    <div className="flex justify-between items-center mb-3">
                                                        <h3 className={`font-medium ${newOrderData.leftEyeEnabled ? "text-gray-800 dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                                                            {t("Left Eye")}
                                                        </h3>
                                                        <Switch
                                                            label={" "}
                                                            defaultChecked={newOrderData.leftEyeEnabled}
                                                            onChange={(checked) => toggleEye('left')}
                                                            disabled={!newOrderData.rightEyeEnabled && newOrderData.leftEyeEnabled}
                                                        />
                                                    </div>
                                                    <div
                                                        className={`space-y-3 ${!newOrderData.leftEyeEnabled ? "pointer-events-none" : ""}`}>
                                                        <div>
                                                            <Label
                                                            >{t("Sphere")} *</Label>
                                                            <select
                                                                name="leftSphere"
                                                                value={newOrderData.leftSphere}
                                                                onChange={handleInputChange}
                                                                disabled={!newOrderData.leftEyeEnabled}
                                                                className={`w-full rounded-md border ${createErrors.leftSphere ? "border-red-500" : "border-gray-300 dark:border-gray-600"} p-2 ${newOrderData.leftEyeEnabled ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}
                                                                required={newOrderData.leftEyeEnabled}
                                                            >
                                                                {sphereOptions.map((option) => (
                                                                    <option key={option} value={option}>
                                                                        {option === "" ? t("Select") : option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <Label
                                                            >{t("Cylinder")}</Label>
                                                            <select
                                                                name="leftCylinder"
                                                                value={newOrderData.leftCylinder}
                                                                onChange={handleInputChange}
                                                                disabled={!newOrderData.leftEyeEnabled}
                                                                className={`w-full rounded-md border ${createErrors.leftCylinder ? "border-red-500" : "border-gray-300 dark:border-gray-600"} p-2 ${newOrderData.leftEyeEnabled ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}
                                                            >
                                                                {cylinderOptions.map((option) => (
                                                                    <option key={option} value={option}>
                                                                        {option === "" ? t("Select") : option}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <Label
                                                            >{t("Axis")}</Label>
                                                            <select
                                                                name="leftAxis"
                                                                value={newOrderData.leftAxis}
                                                                onChange={handleInputChange}
                                                                disabled={!newOrderData.leftEyeEnabled}
                                                                className={`w-full rounded-md border ${createErrors.leftAxis ? "border-red-500" : "border-gray-300 dark:border-gray-600"} p-2 ${newOrderData.leftEyeEnabled ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}
                                                            >
                                                                <option value="">{t("Select")}</option>
                                                                {axisOptions.map((option) => (
                                                                    <option key={option} value={option}>
                                                                        {option}°
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                        {(newOrderData.categoryId === -1 ? hasAddForNewCategory :
                                                            newOrderData.categoryId && categories.find(c => c.id === Number(newOrderData.categoryId))?.hasAdd) ? (
                                                            <div>
                                                                <Label
                                                                >{t("Addition")} *</Label>
                                                                <select
                                                                    name="leftAddition"
                                                                    value={newOrderData.leftAddition}
                                                                    onChange={handleInputChange}
                                                                    disabled={!newOrderData.leftEyeEnabled}
                                                                    className={`w-full rounded-md border ${createErrors.leftAddition ? "border-red-500" : "border-gray-300 dark:border-gray-600"} p-2 ${newOrderData.leftEyeEnabled ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"}`}
                                                                    required={newOrderData.leftEyeEnabled}
                                                                >
                                                                    {additionOptions.map((option) => (
                                                                        <option key={option} value={option}>
                                                                            {option === "" ? t("Select") : option}
                                                                        </option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-6">
                                            <div className="text-center p-4 bg-red-50 dark:bg-red-900/30 rounded-lg">
                                                <p className="font-medium text-red-800 dark:text-red-200">
                                                    {t("Please verify your order before sending. Once sent, the order cannot be updated or canceled.")}
                                                </p>
                                            </div>
                                            <div className="border rounded-lg p-4">
                                                <h4 className="font-medium mb-3">{t("Order Summary")}</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-300">{t("Client Name")}:</span>
                                                        <span className="font-medium">{newOrderData.clientName}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-300">{t("Client Number")}:</span>
                                                        <span className="font-medium">{newOrderData.clientTel}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-300">{t("Category")}:</span>
                                                        <span className="font-medium">
                      {categories.find(c => c.id === Number(newOrderData.categoryId))?.name}
                    </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-300">{t("Verre Price")}:</span>
                                                        <span className="font-medium">{newOrderData.paidAmount} MRU</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-300">{t("Frame Price")}:</span>
                                                        <span className="font-medium">{newOrderData.framePrice} MRU</span>
                                                    </div>
                                                </div>
                                                <div className="mt-4 grid grid-cols-2 gap-4">
                                                    {newOrderData.rightEyeEnabled && (
                                                        <div className="border p-3 rounded-lg">
                                                            <h5 className="font-medium mb-2">{t("Right Eye")}</h5>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between">
                                                                    <span>{t("Sphere")}:</span>
                                                                    <span>{newOrderData.rightSphere || 'N/A'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    {newOrderData.rightCylinder ?
                                                                        <>
                                                                            <span>{t("Cylinder")}:</span><span>{newOrderData.rightCylinder}
                                                                </span></> : <div className="flex justify-between">
                                                                            <span>-</span></div>
                                                                    }
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    {newOrderData.rightAxis ?
                                                                        <>
                                                                            <span>{t("Axis")}:</span><span>{newOrderData.rightAxis}°
                                                                </span></> : <div className="flex justify-between">
                                                                            <span>-</span></div>
                                                                    }
                                                                </div>
                                                                {newOrderData.rightAddition && (
                                                                    <div className="flex justify-between">
                                                                        <span>{t("Addition")}:</span>
                                                                        <span>{newOrderData.rightAddition}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {newOrderData.leftEyeEnabled && (
                                                        <div className="border p-3 rounded-lg">
                                                            <h5 className="font-medium mb-2">{t("Left Eye")}</h5>
                                                            <div className="space-y-1">
                                                                <div className="flex justify-between">
                                                                    <span>{t("Sphere")}:</span>
                                                                    <span>{newOrderData.leftSphere || 'N/A'}</span>
                                                                </div>
                                                                {newOrderData.leftCylinder ? (
                                                                    <div className="flex justify-between">
                                                                        <span>{t("Cylinder")}:</span><span>{newOrderData.leftCylinder}</span>
                                                                    </div>
                                                                ) : <div className="flex justify-between" > <span>-</span></div>}
                                                                {newOrderData.leftAxis ? (
                                                                    <div className="flex justify-between"><span>{t("Axis")}:</span><span>{newOrderData.leftAxis}°</span></div>
                                                                ): <div className="flex justify-between" > <span>-</span></div>}
                                                                {newOrderData.leftAddition && (
                                                                    <div className="flex justify-between">
                                                                        <span>{t("Addition")}:</span>
                                                                        <span>{newOrderData.leftAddition}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-lg font-medium">{t("Total")}:</span>
                                                        <span className="text-lg font-bold">
                      {Number(newOrderData.paidAmount) + Number(newOrderData.framePrice)} MRU
                    </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="sticky bottom-0 z-10 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <div className="flex justify-end space-x-3">
                                        {currentStep === 1 ? (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setIsCreateModalOpen(false)}
                                                >
                                                    {t("Cancel")}
                                                </Button>
                                                <Button
                                                    onClick={() => {
                                                        if (!newOrderData.clientName.trim()) {
                                                            setCreateErrors(prev => ({...prev, clientName: t("Client name is required")}));
                                                            return;
                                                        }
                                                        if (!newOrderData.clientTel.trim()) {
                                                            setCreateErrors(prev => ({...prev, clientTel: t("Client phone is required")}));
                                                            return;
                                                        }

                                                        if (validateForm()) {
                                                            setCurrentStep(2);
                                                        }
                                                    }}
                                                >
                                                    {t("Next")}
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setCurrentStep(1)}
                                                >
                                                    {t("Return")}
                                                </Button>
                                                <Button
                                                    onClick={handleCreateOrder}
                                                    disabled={creatingOrder}
                                                >
                                                    {creatingOrder ? (
                                                        <div className="flex items-center justify-center">
                                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                                                 xmlns="http://www.w3.org/2000/svg" fill="none"
                                                                 viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10"
                                                                        stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor"
                                                                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                        </div>
                                                    ) : (
                                                        t("Confirm Order")
                                                    )}
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
                {isSuccessModalOpen && (
                    <div className="fixed inset-0 z-100 overflow-y-auto">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={overlayVariants}
                            className="fixed inset-0 bg-black"
                            onClick={() => setIsSuccessModalOpen(false)}
                        />
                        <div className="fixed inset-0 flex items-center justify-center p-4">
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                variants={modalVariants}
                                className="relative bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl"
                            >
                                <div className="text-center">
                                    <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900">
                                        <svg
                                            className="h-6 w-6 text-green-600 dark:text-green-400"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    </div>
                                    <h1 className="mt-3 text-lg font-medium text-gray-900 dark:text-white">
                                        {t("Your order has been sent successfully.")}
                                    </h1>
                                    <div className="mt-5">
                                        <Button
                                            onClick={() => setIsSuccessModalOpen(false)}
                                            className="w-full justify-center"
                                        >
                                            {t("OK")}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
