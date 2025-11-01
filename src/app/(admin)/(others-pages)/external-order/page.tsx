"use client";
import React, {useEffect, useState} from "react";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import {useTranslation} from "react-i18next";
import {AnimatePresence, motion} from "framer-motion";
import {GlassesApi} from "@/app/api/GlassesApi";
import {CategoryApi} from "@/app/api/categoryApi";
import {OpticApi} from "@/app/api/OpticApi";
import Switch from "@/components/form/switch/Switch";

import { toast } from "react-toastify";
import {AdminApi} from "@/app/api/AdminApi";
import {EyeIcon, UserIcon} from "@/icons";
import CategorySelect from "@/components/CategorySelect";
import { HiOutlinePrinter } from "react-icons/hi";
import {FaTruck} from "react-icons/fa";
import BackToMenu from "@/components/common/BackToMenu";



interface GlassesOrder {
    id: number;
    optic: {
        id: number;
        opticName: string;
        firstName: string;
        lastName: string;
        tel: string;
    };
    status: "PENDING" | "VALIDATED" | "TRANSIT" | "READY_TO_PICKUP" | "DELIVERED";
    validatedAt: string | null;
    clientName: string;
    clientTel: string;
    rightSphere: string;
    rightCylinder: string;
    rightAxis: number;
    rightAddition: string;
    leftSphere: string;
    leftCylinder: string;
    leftAxis: number;
    leftAddition: string;
    category: {
        id: number;
        name: string;
        arabicName: string;
        isExpensive: boolean;
        amount: number;
        prepayAmount: number | null;
        hasAdd: boolean;
    };
    factureId: number | null;
    paymentStatus: "PAID" | "PARTIAL_PAID" | "UNPAID";
    paidAmount: number | null;
    remainingAmount: number;
    createdAt: string;
    rightEye: boolean;
    leftEye: boolean;
    totalPrice?: number | null;
}

interface Category {
    id: number;
    name: string;
    arabicName: string;
    isExpensive: boolean;
    amount: number;
    hasAdd : boolean;
}

interface Counter {
    id: number;
    dhlRef: string;
    addressLocality: string;
    delivered: boolean;
    count: number;
}

interface NewOrderData {
    clientName: string;
    clientTel: string;
    factureId: string;
    rightSphere: string;
    rightCylinder: string;
    rightAxis: string;
    rightAddition: string;
    leftSphere: string;
    leftCylinder: string;
    leftAxis: string;
    leftAddition: string;
    categoryId: number;
    categoryName?: string;
    paidAmount: string;
    rightEyeEnabled: boolean;
    leftEyeEnabled: boolean;
    totalPrice?: number | null;
    opticId?: number;
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

export default function GlassesOrders() {
    const {t,i18n } = useTranslation();
    const isRTL = i18n.dir() === "rtl";
    const [orders, setOrders] = useState<GlassesOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isValidateModalOpen, setIsValidateModalOpen] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
    const [paidAmount, setPaidAmount] = useState<string>("");
    const [paidAmountError, setPaidAmountError] = useState<string>("");
    const [updatingStatus, setUpdatingStatus] = useState<number>();
    const [categories, setCategories] = useState<Category[]>([]);
    const [isMobile, setIsMobile] = useState(false);
    const [expandedRow, setExpandedRow] = useState<number | null>(null);
    const [currentStep, setCurrentStep] = useState(1);
    const [creatingOrder, setCreatingOrder] = useState(false);
    const [filter, setFilter] = useState<"ALL" | "PENDING" | "VALIDATED" | "TRANSIT" | "READY_TO_PICKUP" | "DELIVERED">("ALL");
    const [paymentFilter, setPaymentFilter] = useState<"ALL" | "PAID" | "PARTIAL_PAID" | "UNPAID">("ALL");
    const [isDeliverModalOpen, setIsDeliverModalOpen] = useState(false);
    const [deliverPaidAll, setDeliverPaidAll] = useState(true);
    const [deliverPaidAmount, setDeliverPaidAmount] = useState("");
    const [deliverError, setDeliverError] = useState("");
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [payPaidAll, setPayPaidAll] = useState(true);
    const [payPaidAmount, setPayPaidAmount] = useState("");
    const [payError, setPayError] = useState("");
    const [paying, setPaying] = useState(false);
    const [statusCounts, setStatusCounts] = useState({
        ALL: 0,
        PENDING: 0,
        VALIDATED: 0,
        TRANSIT: 0,
        READY_TO_PICKUP: 0,
        DELIVERED: 0,
        PAID: 0,
        PARTIAL_PAID: 0,
        UNPAID: 0
    });
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [selectedOrders, setSelectedOrders] = useState<number[]>([]);
    const [markingAsPaid, setMarkingAsPaid] = useState(false);
    const [isDelivering, setIsDelivering] = useState(false);
    const [newOrderData, setNewOrderData] = useState<NewOrderData>({
        clientName: "",
        clientTel: "",
        factureId: "",
        rightSphere: "",
        rightCylinder: "",
        rightAxis: "",
        rightAddition: "",
        leftSphere: "",
        leftCylinder: "",
        leftAxis: "",
        leftAddition: "",
        categoryId: 0,
        categoryName: "",
        paidAmount: "",
        rightEyeEnabled: true,
        leftEyeEnabled: true,
        opticId: undefined
    });
    const [totalPrice, setTotalPrice] = useState<string>("");
    const [totalPriceError, setTotalPriceError] = useState<string>("");
    const [createErrors, setCreateErrors] = useState<Partial<NewOrderData>>({});
    const [allOptics, setAllOptics] = useState<{id: number, name: string}[]>([]);
    const [opticFilter, setOpticFilter] = useState<number | null>(null);
    const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
    const [hasAddForNewCategory, setHasAddForNewCategory] = useState(false);
    const [activeTab, setActiveTab] = useState<'client' | 'optic'>('client');
    const [selectedOpticId, setSelectedOpticId] = useState<number | null>(null);
    const [loadingStates, setLoadingStates] = useState<LoadingStates>({});

    const [isDhlModalOpen, setIsDhlModalOpen] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [dhlRef, setDhlRef] = useState("");
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState("");
    const [counter, setCounter] = useState<Counter>(null);




    useEffect(() => {
        fetchAllOptics();
        fetchCounter();
    }, []);

    const fetchCounter = async () => {
        try {
            const response = await AdminApi.getCounter();
            console.log(response?.data);
            setCounter(response?.data);
        } catch (error) {
            console.error("Failed to fetch counter:", error);
        }
    };

    const fetchAllOptics = async () => {
        try {
            const response = await OpticApi.getAllOptics();
            const opticsData = Array.isArray(response?.data) ? response.data : [];
            const sortedOptics = opticsData.sort((a, b) =>
                a.opticName.localeCompare(b.opticName)
            );
            setAllOptics(sortedOptics.map(optic => ({
                id: optic.id,
                name: optic.opticName
            })));
        } catch (error) {
            console.error("Failed to fetch all optics:", error);
        }
    };

    const downloadInvoice = async (orderId: number) => {
        try {
            setLoadingStates(prev => ({ ...prev, [orderId]: true }));

            const response = await AdminApi.getInvoice(orderId);

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

    const handleDhlUpload = async () => {
        if (!selectedFile) {
            setUploadError(t("Please select a PDF file"));
            return;
        }

        if (!dhlRef.trim()) {
            setUploadError(t("Please enter DHL reference"));
            return;
        }

        setIsUploading(true);
        setUploadError("");

        try {
            const formData = new FormData();
            formData.append("pdf", selectedFile);
            formData.append("dhlRef", dhlRef);
            await AdminApi.uploadDhlTracking(formData);
            toast.success(t("DHL tracking information uploaded successfully"));
            setIsDhlModalOpen(false);
            setSelectedFile(null);
            setDhlRef("");
            fetchOrders();
        } catch (error: any) {
            let errorMessage = t("Failed to upload DHL tracking");
            if (error.response?.data) {
                if (error.response.data.includes("DHL ref already processed")) {
                    errorMessage = t("DHL reference already processed for these orders");
                } else if (error.response.data.includes("PDF already processed")) {
                    errorMessage = t("Cannot proceed - PDF already processed for these orders");
                } else if (error.response.data.includes("Invalid DHL reference")) {
                    errorMessage = t("Invalid DHL reference. Please verify the tracking number.");
                } else if (error.response.data.includes("DHL API error")) {
                    errorMessage = t("Error communicating with DHL API. Please try again later.");
                }
            } else if (error.message) {
                errorMessage = error.message;
            }
            setUploadError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsUploading(false);
        }
    };

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
            const response = await GlassesApi.getAll();
            const allOrders = response?.data || [];
            const sortedOrders = allOrders.sort((a: GlassesOrder, b: GlassesOrder) => b.id - a.id);
            setOrders(sortedOrders);
            const counts = {
                ALL: allOrders.length,
                PENDING: allOrders.filter(o => o.status === "PENDING").length,
                VALIDATED: allOrders.filter(o => o.status === "VALIDATED").length,
                TRANSIT: allOrders.filter(o => o.status === "TRANSIT").length,
                READY_TO_PICKUP: allOrders.filter(o => o.status === "READY_TO_PICKUP").length,
                DELIVERED: allOrders.filter(o => o.status === "DELIVERED").length,
                PAID: allOrders.filter(o => o.paymentStatus === "PAID").length,
                PARTIAL_PAID: allOrders.filter(o => o.paymentStatus === "PARTIAL_PAID").length,
                UNPAID: allOrders.filter(o => o.paymentStatus === "UNPAID").length,
            };
            setStatusCounts(counts);
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

    const openValidateModal = (orderId: number) => {
        setCurrentOrderId(orderId);
        setTotalPrice("");
        setPaidAmount("");
        setTotalPriceError("");
        setPaidAmountError("");
        setIsValidateModalOpen(true);
    };

    const closeValidateModal = () => {
        setIsValidateModalOpen(false);
        setCurrentOrderId(null);
        setPaidAmount("");
        setPaidAmountError("");
    };

    const handleValidateOrder = async () => {
        if (!totalPrice || isNaN(Number(totalPrice))) {
            setTotalPriceError(t("Please enter a valid total price"));
            return;
        }

        if (Number(totalPrice) < 0) {
            setTotalPriceError(t("Total price must be greater than 0"));
            return;
        }

        if (!paidAmount || isNaN(Number(paidAmount))) {
            setPaidAmountError(t("Please enter a valid paid amount"));
            return;
        }

        if (Number(paidAmount) < 0) {
            setPaidAmountError(t("Paid amount cannot be negative"));
            return;
        }

        if (Number(paidAmount) > Number(totalPrice)) {
            setPaidAmountError(t("Paid amount cannot exceed total price"));
            return;
        }

        if (!currentOrderId) return;

        setUpdatingStatus(currentOrderId);
        const originalOrder = orders.find((order) => order.id === currentOrderId);

        setOrders((prev) =>
            prev.map((order) =>
                order.id === currentOrderId
                    ? {
                        ...order,
                        status: "VALIDATED",
                        totalPrice: Number(totalPrice),
                        paidAmount: Number(paidAmount),
                        paymentStatus:
                            Number(paidAmount) >= Number(totalPrice)
                                ? "PAID"
                                : Number(paidAmount) > 0
                                    ? "PARTIAL_PAID"
                                    : "UNPAID",
                        remainingAmount: Number(totalPrice) - Number(paidAmount),
                        validatedAt: new Date().toISOString(),
                    }
                    : order
            )
        );

        try {
            await OpticApi.validateGlassesOrder(
                currentOrderId,
                Number(paidAmount),
                Number(totalPrice)
            );
            closeValidateModal();

            await AdminApi.generateOpticInvoice(currentOrderId);
        } catch (error) {
            setOrders((prev) =>
                prev.map((order) =>
                    order.id === currentOrderId && originalOrder ? originalOrder : order
                )
            );
            console.error("Failed to validate order:", error);
            setPaidAmountError(t("Failed to validate order. Please try again."));
        } finally {
            setUpdatingStatus(null);
        }
    };
    const openCreateModal = () => {
        setIsCreateModalOpen(true);
        setNewOrderData({
            clientName: "",
            clientTel: "",
            factureId: "",
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
            rightEyeEnabled: true,
            leftEyeEnabled: true,
            totalPrice : null
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
                totalPrice: Number(newOrderData.totalPrice),
                rightSphere: newOrderData.rightEyeEnabled ? newOrderData.rightSphere : "",
                rightCylinder: newOrderData.rightEyeEnabled ? newOrderData.rightCylinder : "",
                rightAxis: newOrderData.rightEyeEnabled && newOrderData.rightAxis ? newOrderData.rightAxis : null,
                rightAddition: newOrderData.rightEyeEnabled ? newOrderData.rightAddition : "",
                leftSphere: newOrderData.leftEyeEnabled ? newOrderData.leftSphere : "",
                leftCylinder: newOrderData.leftEyeEnabled ? newOrderData.leftCylinder : "",
                leftAxis: newOrderData.leftEyeEnabled && newOrderData.leftAxis ? newOrderData.leftAxis : null,
                leftAddition: newOrderData.leftEyeEnabled ? newOrderData.leftAddition : "",
                rightEye: newOrderData.rightEyeEnabled,
                leftEye: newOrderData.leftEyeEnabled,
                category: null,
                optic: selectedOpticId ? { id: selectedOpticId } : null
            };

            if (newOrderData.categoryId === -1) {
                payload.category = {
                    name: newOrderData.categoryName || "",
                    hasAdd: hasAddForNewCategory
                };
            } else {
                payload.category = {
                    id: Number(newOrderData.categoryId),
                };
            }

            const response = await GlassesApi.createOrder(payload);
            await fetchOrders();
            await fetchCategories();
            closeCreateModal();
            setCreatingOrder(false);
            setIsSuccessModalOpen(true);
            await GlassesApi.sendInvoice(response?.data?.id, selectedOpticId ? true : false);
            resetForm();
        } catch (error) {
            console.error("Failed to create order:", error);
        } finally {
            setCreatingOrder(false);
        }
    };
    const handleMarkAsPaid = async (opticId: number) => {
        if (selectedOrders.length === 0) {
            alert(t("Please select at least one order to mark as paid"));
            return;
        }

        const selectedOpticIds = new Set(
            selectedOrders.map(id => orders.find(o => o.id === id)?.optic.id)
        );
        if (selectedOpticIds.size > 1) {
            alert(t("Cannot mark as paid: Selected orders must belong to the same optic"));
            return;
        }

        setMarkingAsPaid(true);
        const originalOrders = [...orders];

        setOrders((prev) =>
            prev.map((order) =>
                selectedOrders.includes(order.id)
                    ? {
                        ...order,
                        paymentStatus: "PAID",
                        paidAmount: order.category.amount,
                        remainingAmount: 0,
                    }
                    : order
            )
        );

        try {
            await GlassesApi.markOrdersAsPaidByOptic(opticId, selectedOrders);
            setSelectedOrders([]);
        } catch (error) {
            setOrders(originalOrders);
            console.error("Failed to mark orders as paid:", error);
        } finally {
            setMarkingAsPaid(false);
        }
    };

    useEffect(() => {
        if (isCreateModalOpen || isDhlModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isCreateModalOpen]);


    useEffect(() => {
        if (isCreateModalOpen) {
            resetForm();
            setCurrentStep(1);
        }
    }, [isCreateModalOpen]);


    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value.trim();
        setSearchQuery(query);
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

        const errors: Partial<NewOrderData> = {};

        if (!newOrderData.categoryId) {
            errors.categoryId = t("Category is required");
        } else if (newOrderData.categoryId === -1 && !newOrderData.categoryName?.trim()) {
            errors.categoryName = t("Category name is required when selecting 'Other'");
        }

        if (!newOrderData.totalPrice || isNaN(Number(newOrderData.totalPrice)) || Number(newOrderData.totalPrice) < 0) {
            errors.totalPrice = t("Total price is required and must be a valid number");
        }

        if (!newOrderData.paidAmount || isNaN(Number(newOrderData.paidAmount)) || Number(newOrderData.paidAmount) < 0) {
            errors.paidAmount = t("Paid amount is required and must be a valid number");
        }
        else if (Number(newOrderData.paidAmount) > Number(newOrderData.totalPrice)) {
            errors.paidAmount = t("Paid amount cannot exceed total price");
        }

        if (activeTab === 'client') {
            if (!newOrderData.clientName.trim()) errors.clientName = t("Client name is required");
            if (!newOrderData.clientTel.trim()) errors.clientTel = t("Client phone is required");
        } else if (activeTab === 'optic') {
            if (!selectedOpticId) {
                errors.clientName = t("Optic selection is required");
            }
        }

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
            factureId: "",
            rightSphere: "",
            rightCylinder: "",
            rightAxis: "",
            rightAddition: "",
            leftSphere: "",
            leftCylinder: "",
            leftAxis: "",
            leftAddition: "",
            categoryId: 0,
            categoryName: "",
            paidAmount: "",
            rightEyeEnabled: true,
            leftEyeEnabled: true,
            totalPrice: null,
            opticId: undefined
        });
        setSelectedOpticId(null);
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
        return filteredOrders.reduce((total, order) => total + order.remainingAmount, 0);
    };

    const toggleRowExpand = (id: number) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case "PENDING":
                return "bg-red-100/40 dark:bg-red-900/50";
            case "VALIDATED":
                return "bg-green-100/40 dark:bg-green-900/50";
            case "TRANSIT":
                return "bg-yellow-100 text-red-800 dark:bg-yellow-900 dark:text-red-200";
            case "READY_TO_PICKUP":
                return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
            case "DELIVERED":
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
            case "PAID":
                return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
            case "PARTIAL_PAID":
                return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
            case "UNPAID":
                return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
            default:
                return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
        }
    };

    const filteredOrders = orders.filter((order) => {
        if (filter !== "ALL" && order.status !== filter) return false;
        if (paymentFilter !== "ALL" && order.paymentStatus !== paymentFilter) return false;
        if (opticFilter !== null) {
            if (opticFilter === "null") {
                if (order.optic !== null) return false;
            } else {
                if (!order.optic || order.optic.id !== opticFilter) return false;
            }
        }
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const matchesClientName = order.clientName.toLowerCase().includes(query);
            const matchesOpticName = order.optic?.opticName?.toLowerCase().includes(query) || false;
            const matchesOpticTel = order.optic?.tel?.includes(query) || false;
            const matchesOrderId = order.id.toString().includes(query);
            const matchesClientTel = order.clientTel?.includes(query) || false;
            const matchesFactureId = order.factureId?.includes(query) || false;
            if (
                !matchesClientName &&
                !matchesOpticName &&
                !matchesOpticTel &&
                !matchesOrderId &&
                !matchesClientTel &&
                !matchesFactureId
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
                            {t("Glasses Orders")} ({filteredOrders.length})
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
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value as "ALL" | "PENDING" | "VALIDATED" | "TRANSIT" | "READY_TO_PICKUP" | "DELIVERED")}
                        className="rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="ALL">{t("All Statuses")}</option>
                        <option value="PENDING">{t("Pending")}</option>
                        <option value="VALIDATED">{t("Validated")}</option>
                        <option value="TRANSIT">{t("TRANSIT")}</option>
                        <option value="READY_TO_PICKUP">{t("READY_TO_PICKUP")}</option>
                        <option value="DELIVERED">{t("Delivered")}</option>

                    </select>
                    <select
                        value={paymentFilter}
                        onChange={(e) => setPaymentFilter(e.target.value as "ALL" | "PAID" | "PARTIAL_PAID" | "UNPAID")}
                        className="rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                        <option value="ALL">{t("All Payments")}</option>
                        <option value="PAID">{t("Paid")}</option>
                        <option value="PARTIAL_PAID">{t("Partial Paid")}</option>
                        <option value="UNPAID">{t("Unpaid")}</option>
                    </select>

                    <div className="flex flex-col sm:flex-row gap-2">
                        <Input
                            placeholder={t("Search by Client Name, Optic Name, or Optic Phone")}
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                        <select
                            value={opticFilter || ""}
                            onChange={(e) => {
                                const value = e.target.value;
                                setOpticFilter(
                                    value === "" ? null :
                                        value === "null" ? "null" :
                                            Number(value)
                                );
                            }}
                            className="rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        >
                            <option value="">{t("All Optics")}</option>
                            <option value="null">{isRTL ? "الأمـانة للنظارات" : "Essafwa Optique"}</option>
                            {allOptics.map((optic) => (
                                <option key={optic.id} value={optic.id}>
                                    {optic.name}
                                </option>
                            ))}
                        </select>


                        <Button onClick={openCreateModal} size="sm" className="md:w-auto w-full">
                            {t("Create New Order")}
                        </Button>
                        {counter?.delivered ? (
                            <Button
                                onClick={() => setIsDhlModalOpen(true)}
                                size="sm"
                                className="bg-yellow hover:bg-[#E6B800] text-[#D40511] font-bold border border-[#D40511]"
                            >
                                <div className="flex items-center">
                                    <span className="mrl-2">DHL</span>
                                    {t("Tracking")}
                                </div>
                            </Button>
                        ): (
                            <div
                            className="flex items-center gap-2   text-[#D40511] font-bold border-2 border-[#D40511] rounded-lg px-4 py-2 shadow-md transition-all duration-300 hover:shadow-lg">
                            <img src={`${counter?.addressLocality === "NOUAKCHOTT - MAURITANIA" ? "/images/logo/dhlBus.png" : "/images/logo/dhlPlane.png"}`} alt="DHL" className="h-6 w-auto object-contain" />
                            <span className="text-sm font-semibold text-[#D40511] dark:text-[#D40511]">
                            {counter?.addressLocality}
                            </span>
                            </div>
                            )}
                    </div>

                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"/>
                </div>
            ) : filteredOrders.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                    {opticFilter !== null
                        ? t(`No orders found for ${allOptics.find(optic => optic.id === Number(opticFilter))?.name || 'selected optic'}`)
                        : t("No orders found")}
                </div>
            ) : isMobile ? (
                <div className="space-y-4">
                    {filteredOrders.map((order) => (
                        <div
                            key={order.id}
                            className={`rounded-lg shadow-md ${getStatusColor(order.status)}`}
                        >
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex flex-col">
                                        <h3 className="font-medium text-gray-800 dark:text-white">
                                            #{order.id} {order.factureId && `(F: ${order.factureId})`} - {order.clientName}
                                        </h3>
                                        <h3 className={`${isRTL ? 'text-m' : 'text-xs'} font-medium text-gray-800 dark:text-white`}>
                                            {order?.optic?.opticName != null ? order.optic?.opticName : `${isRTL ? `الأمـانة للنظارات` : `Essafwa Optique`}`}
                                        </h3>
                                    </div>
                                    <div className="flex items-center gap-2">
            <span
                className={`px-2 py-1 rounded-full text-s font-medium ${getStatusColor(order.paymentStatus)}`}
            >
              {t(order.paymentStatus)}
            </span>
                                    </div>
                                </div>


                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <p className="text-gray-800 dark:text-gray-400">{t("Category")}:</p>
                                        <p>{order?.category?.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-800 dark:text-gray-400">{t("Date")}:</p>
                                        <p>{formatDate(order.createdAt)}</p>
                                    </div>
                                    {order.clientTel && <p><span
                                        className="text-gray-800 dark:text-gray-400">{t("Client Number")}:</span> {order.clientTel}
                                    </p>}
                                </div>

                                <div className="grid grid-cols-3 gap-2 mt-2 text-sm">
                                    <div>
                                        <p className="text-gray-800 dark:text-gray-400">{t("Total")}:</p>
                                        <p>{order?.totalPrice} MRU</p>
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

                                <div
                                    className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-600 flex justify-between items-center">
                                    {order.status === "PENDING" ? (
                                        <Button
                                            onClick={() => openValidateModal(order.id)}
                                            disabled={updatingStatus === order.id}
                                            size="sm"
                                            className={updatingStatus === order.id ? "bg-gray-400 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"}
                                        >
                                            {updatingStatus === order.id ? (
                                                <div
                                                    className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                            ) : (
                                                t("Validate")
                                            )}
                                        </Button>
                                    ) : order.status === "DELIVERED" ? (
                                        <span
                                            className="px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-medium">
            {t("Delivered")}
        </span>
                                    ) : (
                                        <>
                                            {order.status === "READY_TO_PICKUP" && (
                                                <Button
                                                    onClick={() => {
                                                        setCurrentOrderId(order.id);
                                                        setDeliverPaidAll(true);
                                                        setDeliverPaidAmount("");
                                                        setDeliverError("");
                                                        setIsDeliverModalOpen(true);
                                                    }}
                                                    size="sm"
                                                >
                                                    {t("Deliver")}
                                                </Button>
                                            )}

                                            {order.status !== "PENDING" && order.paymentStatus !== "PAID" && (
                                                <Button
                                                    onClick={() => {
                                                        setCurrentOrderId(order.id);
                                                        setPayPaidAll(true);
                                                        setPayPaidAmount("");
                                                        setPayError("");
                                                        setIsPayModalOpen(true);
                                                    }}
                                                    size="sm"
                                                    className="bg-bleu-500 hover:bg-bleu-600"
                                                >
                                                    {t("Pay Order")}
                                                </Button>
                                            )}
                                        </>
                                    )}
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
                                {t("Optic")}
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
                                {t("Payment Status")}
                            </th>
                            <th className={`px-6 py-3 ${isRTL ? 'text-right' : 'text-left'} ${isRTL ? 'text-m' : 'text-xs'} font-medium text-gray-800 dark:text-gray-400 uppercase tracking-wider`}>
                                {t("Date")}
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
                                        #{order.id} {order.factureId && <span
                                        className="text-gray-800 dark:text-gray-400">(F: {order.factureId})</span>}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-m text-gray-800 dark:text-gray-400">
                                        {order.optic?.opticName != null ? order.optic?.opticName : `${isRTL ? `الأمـانة للنظارات` : `Essafwa Optique`}`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 dark:text-gray-400">
                                        {order.totalPrice != null ? `${order.totalPrice} MRU` : '---'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 dark:text-green-400">
                                        {order.paidAmount != null ? `${order.paidAmount} MRU` : '---'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 dark:text-red-400">
                                        {order.remainingAmount != null ? `${order.remainingAmount} MRU` : '---'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.paymentStatus)}`}>
                                                {t(order.paymentStatus)}
                                            </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {formatDate(order.createdAt)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {order.status === "PENDING" ? (
                                            <Button
                                                onClick={() => openValidateModal(order.id)}
                                                disabled={updatingStatus === order.id}
                                                size="sm"
                                                className={
                                                    updatingStatus === order.id
                                                        ? "bg-gray-400 cursor-not-allowed"
                                                        : "bg-green-500 hover:bg-green-600"
                                                }
                                            >
                                                {updatingStatus === order.id ? (
                                                    <div
                                                        className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                                ) : (
                                                    t("Validate")
                                                )}
                                            </Button>
                                        ) : order.status === "DELIVERED" ? (
                                            <span
                                                className="px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium">
      {t("Delivered")}
    </span>
                                        ) : (
                                            <div className="flex items-center">
                                                <Button
                                                    onClick={() => {
                                                        setCurrentOrderId(order.id);
                                                        setDeliverPaidAll(true);
                                                        setDeliverPaidAmount("");
                                                        setDeliverError("");
                                                        setIsDeliverModalOpen(true);
                                                    }}
                                                    size="sm"
                                                    className="bg-[#961767] hover:bg-[#7a1255] text-white"
                                                >
                                                    {t("Deliver")}
                                                </Button>

                                                {order.status !== "PENDING" && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            downloadInvoice(order.id!);
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
                                                )}
                                            </div>
                                        )}

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
                                            {order.paymentStatus !== "PAID" && (
                                                <div className="mt-4 flex justify-end">
                                                    <Button
                                                        onClick={() => {
                                                            setCurrentOrderId(order.id);
                                                            setPayPaidAll(true);
                                                            setPayPaidAmount("");
                                                            setPayError("");
                                                            setIsPayModalOpen(true);
                                                        }}
                                                        size="sm"
                                                        className="bg-green-500 hover:bg-green-600"
                                                    >
                                                        {t("Pay Order")}
                                                    </Button>
                                                </div>
                                            )}

                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                        </tbody>
                    </table>
                </div>
            )}
            {isPayModalOpen && (
                <div className="fixed inset-0 z-100 overflow-y-auto">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={overlayVariants}
                        className="fixed inset-0 bg-black"
                        onClick={() => setIsPayModalOpen(false)}
                    />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={modalVariants}
                            className="relative bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl"
                        >
                            <h3 className="text-lg font-medium mb-4">{t("Pay Order")}</h3>

                            <p className="mb-2">
                                {t("Remaining Amount")}:{" "}
                                <span className="font-bold text-red-600">
            {orders.find(o => o.id === currentOrderId)?.remainingAmount} MRU
          </span>
                            </p>

                            <div className="space-y-2 mb-4">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        checked={payPaidAll}
                                        onChange={() => {
                                            setPayPaidAll(true);
                                            setPayPaidAmount("");
                                            setPayError("");
                                        }}
                                    />
                                    <span>{t("Paid All")}</span>
                                </label>
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        checked={!payPaidAll}
                                        onChange={() => {
                                            setPayPaidAll(false);
                                            setPayPaidAmount("");
                                        }}
                                    />
                                    <span>{t("Paid Partial")}</span>
                                </label>
                            </div>

                            {!payPaidAll && (
                                <div className="mb-4">
                                    <input
                                        className="w-full border border-gray-300 rounded p-2"
                                        placeholder={t("Enter partial paid amount")}
                                        value={payPaidAmount}
                                        onChange={(e) => setPayPaidAmount(e.target.value)}
                                    />
                                    {payError && (
                                        <p className="text-sm text-red-600 mt-1">{payError}</p>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end space-x-3">
                                <Button variant="outline" onClick={() => setIsPayModalOpen(false)}>
                                    {t("Cancel")}
                                </Button>
                                <Button
                                    onClick={async () => {
                                        const order = orders.find(o => o.id === currentOrderId);
                                        const remaining = order?.remainingAmount || 0;

                                        let finalAllPaid = true;
                                        let finalPaidAmount = undefined;

                                        if (!payPaidAll) {
                                            const paid = Number(payPaidAmount);
                                            if (isNaN(paid) || paid < 0) {
                                                setPayError(t("Enter valid amount"));
                                                return;
                                            }
                                            if (paid >= remaining) {
                                                setPayError(t("Partial paid amount must be less than remaining amount"));
                                                return;
                                            }
                                            finalAllPaid = false;
                                            finalPaidAmount = paid;
                                        } else {
                                            finalAllPaid = true;
                                            finalPaidAmount = remaining;
                                        }

                                        setPaying(true);
                                        try {
                                            await AdminApi.payOrder(currentOrderId, finalAllPaid, finalPaidAmount);
                                            setIsPayModalOpen(false);
                                            await fetchOrders();
                                            await AdminApi.sendPayInvoice(currentOrderId);
                                        } catch (error) {
                                            console.error("Failed to pay order", error);
                                            setPayError(t("Failed to pay order. Please try again."));
                                        } finally {
                                            setPaying(false);
                                        }
                                    }}
                                    disabled={paying}
                                >
                                    {paying ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                    ) : (
                                        t("Confirm Pay")
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </div>
            )}

            {isDeliverModalOpen && (
                <div className="fixed inset-0 z-100 overflow-y-auto">
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        variants={overlayVariants}
                        className="fixed inset-0 bg-black"
                        onClick={() => setIsDeliverModalOpen(false)}
                    />
                    <div className="fixed inset-0 flex items-center justify-center p-4">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={modalVariants}
                            className="relative bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl"
                        >
                            {(() => {
                                const order = orders.find(o => o.id === currentOrderId);
                                const remaining = order?.remainingAmount || 0;

                                return (
                                    <>
                                        <h3 className="text-lg font-medium mb-4">{t("Deliver Order")}</h3>

                                        <p className="mb-2">
                                            {t("Remaining Amount")}:{" "}
                                            <span className="font-bold text-red-600">
                  {remaining} MRU
                </span>
                                        </p>

                                        {order?.paymentStatus !== "PAID" && (
                                            <>
                                                <div className="space-y-2 mb-4">
                                                    <label className="flex items-center space-x-2">
                                                        <input
                                                            type="radio"
                                                            checked={deliverPaidAll}
                                                            onChange={() => {
                                                                setDeliverPaidAll(true);
                                                                setDeliverPaidAmount("");
                                                                setDeliverError("");
                                                            }}
                                                        />
                                                        <span>{t("Paid All")}</span>
                                                    </label>
                                                    <label className="flex items-center space-x-2">
                                                        <input
                                                            type="radio"
                                                            checked={!deliverPaidAll}
                                                            onChange={() => {
                                                                setDeliverPaidAll(false);
                                                                setDeliverPaidAmount("");
                                                            }}
                                                        />
                                                        <span>{t("Paid Partial")}</span>
                                                    </label>
                                                </div>

                                                {!deliverPaidAll && (
                                                    <div className="mb-4">
                                                        <input
                                                            className="w-full border border-gray-300 rounded p-2"
                                                            placeholder={t("Enter partial paid amount")}
                                                            value={deliverPaidAmount}
                                                            onChange={(e) => setDeliverPaidAmount(e.target.value)}
                                                        />
                                                        {deliverError && (
                                                            <p className="text-sm text-red-600 mt-1">{deliverError}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        <div className="flex justify-end space-x-3">
                                            <Button variant="outline" onClick={() => setIsDeliverModalOpen(false)}>
                                                {t("Cancel")}
                                            </Button>
                                            <Button
                                                onClick={async () => {
                                                    const order = orders.find(o => o.id === currentOrderId);
                                                    const remaining = order?.remainingAmount || 0;

                                                    let finalAllPaid = true;
                                                    let finalPaidAmount = undefined;

                                                    if (order?.paymentStatus !== "PAID") {
                                                        if (!deliverPaidAll) {
                                                            const paid = Number(deliverPaidAmount);
                                                            if (isNaN(paid) || paid < 0) {
                                                                setDeliverError(t("Enter valid amount"));
                                                                return;
                                                            }
                                                            if (paid >= remaining) {
                                                                setDeliverError(t("Partial paid amount must be less than remaining amount"));
                                                                return;
                                                            }
                                                            finalAllPaid = false;
                                                            finalPaidAmount = paid;
                                                        } else {
                                                            finalAllPaid = true;
                                                            finalPaidAmount = remaining;
                                                        }
                                                    }

                                                    if (remaining === 0) {
                                                        finalAllPaid = true;
                                                        finalPaidAmount = undefined;
                                                    }

                                                    setIsDelivering(true);

                                                    try {
                                                        await AdminApi.deliverOrder(currentOrderId, finalAllPaid, finalPaidAmount);
                                                        setIsDelivering(false);
                                                        setIsDeliverModalOpen(false);
                                                        fetchOrders();
                                                        await AdminApi.sendDeliverInvoice(currentOrderId);
                                                        toast.success(t("Order delivered successfully"));
                                                    } catch (error) {
                                                        console.error("Failed to deliver order", error);
                                                        setDeliverError(t("Failed to deliver order. Please try again."));
                                                        toast.error(t("Failed to deliver order. Please try again."));
                                                    } finally {
                                                        setIsDelivering(false);
                                                    }
                                                }}
                                                disabled={isDelivering}
                                            >
                                                {isDelivering ? (
                                                    <div className="flex items-center justify-center">
                                                        <svg className="animate-spin h-5 w-5 mr-2 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373
0 0 5.373 0 12h4zm2 5.291A7.962
7.962 0 014 12H0c0 3.042 1.135
5.824 3 7.938l3-2.647z"></path>
                                                        </svg>
                                                        {t("Delivering...")}
                                                    </div>
                                                ) : (
                                                    t("Confirm Deliver")
                                                )}
                                            </Button>

                                        </div>
                                    </>
                                );
                            })()}
                        </motion.div>
                    </div>
                </div>
            )}

            <AnimatePresence>
                {isValidateModalOpen && (
                    <div className="fixed inset-0 z-100 overflow-y-auto">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={overlayVariants}
                            className="fixed inset-0 bg-black"
                            onClick={closeValidateModal}
                        />
                        <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-6">
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                variants={isMobile ? bottomSheetVariants : modalVariants}
                                className={`
            w-full bg-white dark:bg-gray-800 shadow-xl
            ${isMobile
                                    ? 'fixed bottom-0 left-0 right-0 max-h-none rounded-none overflow-y-auto'
                                    : 'relative max-w-lg rounded-lg max-h-[90vh] overflow-y-auto'}
          `}
                            >
                                <div className="sticky top-0 z-10 flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t("Validate Order")}</h3>
                                    <button
                                        onClick={closeValidateModal}
                                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                    >
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                                        </svg>
                                    </button>
                                </div>
                                <div className="p-4 space-y-4">
                                    <div>
                                        <Label>{t("Total Price")} *</Label>
                                        <Input
                                            placeholder={t("Enter total price")}
                                            value={totalPrice}
                                            onChange={(e) => {
                                                setTotalPrice(e.target.value);
                                                setTotalPriceError("");
                                            }}
                                            error={totalPriceError}
                                            min="0.01"
                                            step="0.01"
                                        />
                                        {totalPriceError && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                {totalPriceError}
                                            </p>
                                        )}
                                    </div>
                                    <div>
                                        <Label>{t("Paid Amount")} *</Label>
                                        <Input
                                            placeholder={t("Enter paid amount")}
                                            value={paidAmount}
                                            onChange={(e) => {
                                                setPaidAmount(e.target.value);
                                                setPaidAmountError("");
                                            }}
                                            error={paidAmountError}
                                            min="0"
                                            step="0.01"
                                        />
                                        {paidAmountError && (
                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                {paidAmountError}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="sticky bottom-0 z-10 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                    <div className="flex justify-end space-x-3">
                                        <Button variant="outline" onClick={closeValidateModal}>
                                            {t("Cancel")}
                                        </Button>
                                        <Button
                                            onClick={handleValidateOrder}
                                            disabled={updatingStatus === currentOrderId}
                                            className={updatingStatus === currentOrderId ? "bg-gray-400 cursor-not-allowed" : ""}
                                        >
                                            {updatingStatus === currentOrderId ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>
                                            ) : (
                                                t("Validate")
                                            )}
                                        </Button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                )}
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
                                            <div
                                                className="flex border-b border-gray-200 dark:border-gray-700 mb-8 gap-1">
                                                <button
                                                    className={`relative px-5 py-3.5 text-sm font-medium transition-all duration-300 focus:outline-none ${
                                                        activeTab === 'client'
                                                            ? 'text-blue-600 dark:text-blue-300'
                                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                                    } rounded-t-lg`}
                                                    onClick={() => {
                                                        setActiveTab('client');
                                                        resetForm();
                                                    }}
                                                    aria-current={activeTab === 'client' ? 'page' : undefined}
                                                >
    <span className="z-10 relative flex items-center justify-center gap-1.5">
      <UserIcon className="w-4 h-4"/>
        {t("Client")}
    </span>
                                                    {activeTab === 'client' && (
                                                        <span
                                                            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4/5 h-0.5 bg-blue-500 rounded-full animate-underline"></span>
                                                    )}
                                                </button>


                                                <button
                                                    className={`relative px-5 py-3.5 text-sm font-medium transition-all duration-300 focus:outline-none ${
                                                        activeTab === 'optic'
                                                            ? 'text-blue-600 dark:text-blue-300'
                                                            : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                                    } rounded-t-lg`}
                                                    onClick={() => {
                                                        resetForm();
                                                        setActiveTab('optic');
                                                    }}
                                                    aria-current={activeTab === 'optic' ? 'page' : undefined}
                                                >
    <span className="z-10 relative flex items-center justify-center gap-1.5">
      <EyeIcon className="w-4 h-4"/>
        {t("Optic")}
    </span>
                                                    {activeTab === 'optic' && (
                                                        <span
                                                            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-4/5 h-0.5 bg-blue-500 rounded-full animate-underline"></span>
                                                    )}
                                                </button>
                                            </div>

                                            <div>
                                                <Label>{t("Client Name")} *</Label>
                                                <Input
                                                    name="clientName"
                                                    defaultValue={newOrderData.clientName}
                                                    onChange={handleInputChange}
                                                    placeholder={t("Enter client name")}
                                                    error={createErrors.clientName}
                                                />
                                                {createErrors.clientName && (
                                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                        {createErrors.clientName}
                                                    </p>
                                                )}
                                            </div>

                                            {activeTab === 'client' && (

                                                <div>
                                                    <Label>{t("Client Number")} *</Label>
                                                    <Input
                                                        name="clientTel"
                                                        defaultValue={newOrderData.clientTel}
                                                        onChange={handleInputChange}
                                                        placeholder={t("Enter client number")}
                                                        error={createErrors.clientTel}
                                                    />
                                                        {createErrors.clientTel && (
                                                            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                                {createErrors.clientTel}
                                                            </p>
                                                        )}
                                                    </div>
                                            )}

                                            {activeTab === 'optic' && (
                                                <div>
                                                    <Label>{t("Select Optic")} *</Label>
                                                    <select
                                                        value={selectedOpticId || ""}
                                                        onChange={(e) => setSelectedOpticId(e.target.value ? Number(e.target.value) : null)}
                                                        className="w-full rounded-md border border-gray-300 dark:border-gray-600 p-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                                    >
                                                        <option value="">{t("Select")}</option>
                                                        {allOptics.map((optic) => (
                                                            <option key={optic.id} value={optic.id}>
                                                                {optic.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}

                                            <div>
                                                <Label>{t("Category")} *</Label>
                                                <CategorySelect
                                                    categories={categories}
                                                    value={newOrderData.categoryId}
                                                    onChange={(categoryId) => {
                                                        setNewOrderData(prev => ({
                                                            ...prev,
                                                            categoryId,
                                                            categoryName: categoryId === -1 ? "" : undefined
                                                        }));
                                                    }}
                                                    error={createErrors.categoryId}
                                                    onNewCategory={(name) => {
                                                        setNewOrderData(prev => ({
                                                            ...prev,
                                                            categoryName: name
                                                        }));
                                                    }}
                                                />
                                                {newOrderData.categoryId === -1 && (
                                                    <div className="mt-2">
                                                        <Input
                                                            name="categoryName"
                                                            defaultValue={newOrderData.categoryName || ""}
                                                            onChange={(e) => setNewOrderData(prev => ({
                                                                ...prev,
                                                                categoryName: e.target.value
                                                            }))}
                                                            placeholder={t("Enter category name")}
                                                            error={createErrors.categoryName}
                                                        />
                                                        <div className="flex items-center mt-2">
                                                            <Label className="mr-2">{t("Has Addition")}</Label>
                                                            <Switch
                                                                checked={hasAddForNewCategory}
                                                                onChange={() => setHasAddForNewCategory(!hasAddForNewCategory)}
                                                                className={`
                          ${hasAddForNewCategory ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}
                          relative inline-flex h-6 w-11 items-center rounded-full
                        `}
                                                            >
                        <span
                            className={`${hasAddForNewCategory ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}
                        />
                                                            </Switch>
                                                        </div>
                                                    </div>
                                                )}
                                                {createErrors.categoryId && (
                                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                        {createErrors.categoryId}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>{t("Total Price")} *</Label>
                                                <Input
                                                    name="totalPrice"
                                                    defaultValue={newOrderData.totalPrice}
                                                    onChange={handleInputChange}
                                                    placeholder={t("Enter total price")}
                                                    error={createErrors.totalPrice}
                                                />
                                                {createErrors.totalPrice && (
                                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                        {createErrors.totalPrice}
                                                    </p>
                                                )}
                                            </div>

                                            <div>
                                                <Label>{t("Paid Amount")} *</Label>
                                                <Input
                                                    name="paidAmount"
                                                    defaultValue={newOrderData.paidAmount}
                                                    onChange={handleInputChange}
                                                    placeholder={t("Enter paid amount")}
                                                    max={categories.find(c => c.id === Number(newOrderData.categoryId))?.amount || undefined}
                                                    error={createErrors.paidAmount}
                                                />
                                                {createErrors.paidAmount && (
                                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                                        {createErrors.paidAmount}
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
                                                            defaultChecked={newOrderData.rightEyeEnabled}
                                                            onChange={() => toggleEye('right')}
                                                            disabled={!newOrderData.leftEyeEnabled && newOrderData.rightEyeEnabled}
                                                            className={`
                        ${newOrderData.rightEyeEnabled ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}
                        relative inline-flex h-6 w-11 items-center rounded-full
                      `}
                                                        >
                      <span
                          className={`${newOrderData.rightEyeEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}
                      />
                                                        </Switch>
                                                    </div>
                                                    <div
                                                        className={`space-y-3 ${!newOrderData.rightEyeEnabled ? "pointer-events-none" : ""}`}>
                                                        <div>
                                                            <Label
                                                                enabled={newOrderData.rightEyeEnabled}>{t("Sphere")} *</Label>
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
                                                            <Label
                                                                enabled={newOrderData.rightEyeEnabled}>{t("Cylinder")}</Label>
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
                                                                enabled={!!newOrderData.rightEyeEnabled}>{t("Axis")}</Label>
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
                                                                    enabled={newOrderData.rightEyeEnabled}>{t("Addition")} *</Label>
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
                                                            defaultChecked={newOrderData.leftEyeEnabled}
                                                            onChange={() => toggleEye('left')}
                                                            disabled={!newOrderData.rightEyeEnabled && newOrderData.leftEyeEnabled}
                                                            className={`
                        ${newOrderData.leftEyeEnabled ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'}
                        relative inline-flex h-6 w-11 items-center rounded-full
                      `}
                                                        >
                      <span
                          className={`${newOrderData.leftEyeEnabled ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition`}
                      />
                                                        </Switch>
                                                    </div>
                                                    <div
                                                        className={`space-y-3 ${!newOrderData.leftEyeEnabled ? "pointer-events-none" : ""}`}>
                                                        <div>
                                                            <Label
                                                                enabled={newOrderData.leftEyeEnabled}>{t("Sphere")} *</Label>
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
                                                                enabled={newOrderData.leftEyeEnabled}>{t("Cylinder")}</Label>
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
                                                                enabled={newOrderData.leftEyeEnabled}>{t("Axis")}</Label>
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
                                                                    enabled={newOrderData.leftEyeEnabled}>{t("Addition")} *</Label>
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
                                                    {selectedOpticId && (
                                                        <div className="flex justify-between">
                                                            <span
                                                                className="text-gray-600 dark:text-gray-300">{t("Optic")}:</span>
                                                            <span className="font-medium">
                        {allOptics.find(o => o.id === selectedOpticId)?.name}
                      </span>
                                                        </div>
                                                    )}
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
                      {categories.find(c => c.id === Number(newOrderData.categoryId))?.name || newOrderData.categoryName}
                    </span>
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
                      {newOrderData.totalPrice ? `${newOrderData.totalPrice} MRU` : ''}
                    </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-lg font-medium">{t("Paid")}:</span>
                                                        <span className="text-lg font-bold text-green-800 dark:text-green-400">
                      {newOrderData.totalPrice ? `${newOrderData.paidAmount} MRU` : ''}
                    </span>
                                                    </div>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-lg font-medium">{t("Remaining")}:</span>
                                                        <span className="text-lg font-bold text-red-800 dark:text-red-400">
                      {newOrderData.totalPrice ? `${Number(newOrderData.totalPrice) - Number(newOrderData.paidAmount)} MRU` : ''}
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
                                                        // Validate required fields based on active tab
                                                        if (activeTab === 'client') {
                                                            if (!newOrderData.clientName.trim()) {
                                                                setCreateErrors(prev => ({...prev, clientName: t("Client name is required")}));
                                                                return;
                                                            }
                                                            if (!newOrderData.clientTel.trim()) {
                                                                setCreateErrors(prev => ({...prev, clientTel: t("Client phone is required")}));
                                                                return;
                                                            }
                                                        } else {
                                                            if (!selectedOpticId) {
                                                                toast.error(t("Please select an optic"));
                                                                return;
                                                            }
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
                                            type="button"
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

                {isDhlModalOpen && (
                    <div className="fixed inset-0 z-100 overflow-y-auto">
                        <motion.div
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            variants={overlayVariants}
                            className="fixed inset-0 bg-black"
                            onClick={() => setIsDhlModalOpen(false)}
                        />
                        <div className="fixed inset-0 flex items-center justify-center p-4">
                            <motion.div
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                                variants={modalVariants}
                                className="relative bg-white rounded-lg max-w-md w-full shadow-xl border-t-4 border-[#FFCC00]"
                            >
                                <div className="p-6">
                                    <div className="flex items-center mb-4">
                                        <div className="bg-[#FFCC00] rounded-md text-[#D40511] px-3 py-1  font-bold mr-3">
                                            DHL
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-800 mr-2">
                                            {t("Add Tracking Information")}
                                        </h3>
                                    </div>

                                    <div className="mb-4">
                                        <Label className="text-gray-700 font-medium">
                                            {t("DHL Tracking Number")} *
                                        </Label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                                                <svg className="w-5 h-5 text-[#D40511]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                                </svg>
                                            </div>
                                            <Input
                                                placeholder={t("Enter DHL tracking number")}
                                                value={dhlRef}
                                                onChange={(e) => setDhlRef(e.target.value)}
                                                className="pl-10 border-[#FFCC00] focus:ring-[#D40511] focus:border-[#D40511]"
                                            />
                                        </div>
                                    </div>

                                    <div className="mb-4">
                                        <Label className="text-gray-700 font-medium">
                                            {t("Shipping Document")} *
                                        </Label>

                                        {!selectedFile ? (
                                            <div className="mt-1">
                                                <label className={`
        flex flex-col items-center justify-center px-6 pt-5 pb-6 
        border-2 border-dashed border-[#FFCC00] rounded-md bg-[#FFF8E1]
        cursor-pointer hover:bg-[#FFEEB2] transition-colors
        ${isUploading ? 'opacity-50 pointer-events-none' : ''}
      `}>
                                                        <div className="space-y-1 text-center">
                                                            <svg
                                                                className="mx-auto h-12 w-12 text-[#D40511]"
                                                                stroke="currentColor"
                                                                fill="none"
                                                                viewBox="0 0 48 48"
                                                                aria-hidden="true"
                                                            >
                                                                <path
                                                                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                />
                                                            </svg>
                                                            <div className="flex justify-center text-sm text-gray-600">
              <span className="bg-[#FFCC00] rounded-md font-medium text-[#D40511] hover:text-[#A30000] px-3 py-1">
                {t("Upload a file")}
              </span>
                                                            </div>
                                                        </div>
                                                    <input
                                                        type="file"
                                                        className="hidden"
                                                        accept=".pdf"
                                                        onChange={(e) => {
                                                            if (e.target.files?.[0]) {
                                                                setSelectedFile(e.target.files[0]);
                                                            }
                                                        }}
                                                        disabled={isUploading}
                                                    />
                                                </label>
                                            </div>
                                        ) : (
                                            <div className="mt-2">
                                                <div
                                                    className="flex items-center justify-between bg-[#FFEEB2] p-3 rounded-md border border-[#FFCC00]">
                                                    <div className="flex items-center">
                                                        <svg className="h-5 w-5 text-[#D40511]" fill="none"
                                                             viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  strokeWidth="2"
                                                                  d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
                                                        </svg>
                                                        <div className="ml-3">
                                                            <p className="text-sm font-medium text-gray-700 truncate max-w-xs">
                                                                {selectedFile.name}
                                                            </p>
                                                            <p className="text-xs text-gray-500">
                                                                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            setSelectedFile(null);
                                                            setUploadError("");
                                                        }}
                                                        className="text-[#D40511] hover:text-[#A30000] p-1 rounded-full hover:bg-[#FFCC00]/20"
                                                    >
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24"
                                                             stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round"
                                                                  strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                                                        </svg>
                                                    </button>
                                                </div>
                                            </div>
                                        )}

                                        {uploadError && (
                                            <div
                                                className="mt-2 p-3 bg-red-50 border-l-4 border-[#D40511] text-red-700">
                                                <p>{uploadError}</p>
                                            </div>
                                        )}
                                    </div>


                                    <div className="flex justify-end space-x-3 mt-6">
                                        <Button
                                            variant="outline"
                                            onClick={() => setIsDhlModalOpen(false)}
                                            className="border-[#D40511] text-[#D40511] hover:bg-[#FFEEB2]"
                                        >
                                            {t("Cancel")}
                                        </Button>
                                        <Button
                                            onClick={handleDhlUpload}
                                            disabled={isUploading}
                                            className="bg-[#FFCC00] text-[#D40511] hover:bg-[#FFCC10]"
                                        >
                                            {isUploading ? (
                                                <div className="flex items-center justify-center ">
                                                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#D40511]"
                                                         xmlns="http://www.w3.org/2000/svg" fill="none"
                                                         viewBox="0 0 24 24">
                                                        <circle className="opacity-25" cx="12" cy="12" r="10"
                                                                stroke="currentColor" strokeWidth="4"></circle>
                                                        <path className="opacity-75" fill="currentColor"
                                                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                    </svg>
                                                    {t("Sending...")}
                                                </div>
                                            ) : (
                                                <div className="flex items-center">
                                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor"
                                                         viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round"
                                                              strokeWidth="2" d="M5 12h14M12 5l7 7-7 7"/>
                                                    </svg>
                                                    {t("Send Tracking")}
                                                </div>
                                            )}
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
