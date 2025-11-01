"use client";
import React, {useEffect, useState} from "react";
import Badge from "../ui/badge/Badge";
import {OrderApi} from "@/app/api/orderApi";
import {Table, TableBody, TableCell, TableHeader, TableRow,} from "../ui/table";
import {compressImage} from "@/lib/helper";
import {useTranslation} from 'react-i18next';
import {motion} from 'framer-motion';

interface Order {
    id: number;
    status: "PENDING" | "CONFIRMED" | "CONSTRUCTED" | "DELIVERED" | "CANCELED";
    frameChanged: boolean;
    createdAt: string;
    prescription: string;
    contacted: boolean;
    note: string | null;
    hasCnam : boolean;
    patientStatus: "RANDOM" | "DIRECT";
    client: {
        id: number;
        tel: string;
        firstName: string;
        lastName: string;
        hasWhatsapp: boolean;
        cabinetDTO: {
            id: number;
            name: string;
        };
    };
}

export default function RecentOrders() {
    const {t} = useTranslation();
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(false);
    const [cabinets, setCabinets] = useState([]);
    const [selectedCabinet, setSelectedCabinet] = useState<null | number>(null);
    const [selectedStatus, setSelectedStatus] = useState<null | Order["status"]>(null);
    const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
    const [orderCounts, setOrderCounts] = useState<{ status: string; count: number }[]>([]);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [uploadingPrescription, setUploadingPrescription] = useState<number | null>(null);
    const [filterHasWhatsapp, setFilterHasWhatsapp] = useState<null | boolean>(null);
    const [viewingPrescriptions, setViewingPrescriptions] = useState<{
        orderId: number;
        prescriptions: any[]
    } | null>(null);
    const [prescriptionLoading, setPrescriptionLoading] = useState(false);
    const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
    const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
    const [newNote, setNewNote] = useState("");
    const [noteErrors, setNoteErrors] = useState({note: false});
    const [isEditingNote, setIsEditingNote] = useState(false); // Track if we're editing a note
    const [loadingPrescriptions, setLoadingPrescriptions] = useState(false);
    const [updatingContacted, setUpdatingContacted] = useState<number | null>(null);
    const [isCnamModalOpen, setIsCnamModalOpen] = useState(false);
    const [currentCnamOrderId, setCurrentCnamOrderId] = useState<number | null>(null);
    const [nni, setNni] = useState("");
    const [cnamRef, setCnamRef] = useState("");
    const [cnamErrors, setCnamErrors] = useState({nni: false});

    const [isAddingClient, setIsAddingClient] = useState(false);
    const [newClientData, setNewClientData] = useState({
        name: "",
        tel: "",
    });
    const [isSaving, setIsSaving] = useState(false);


    const [errors, setErrors] = useState<{ name?: string; tel?: string }>({});

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = event.target;
        setNewClientData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setErrors((prevErrors) => ({
            ...prevErrors,
            [name]: undefined,
        }));
    };

    const validateForm = () => {
        const newErrors: { name?: string; tel?: string } = {};
        if (!newClientData.name.trim()) {
            newErrors.name = t("The name is required.");
        }
        if (!newClientData.tel.trim()) {
            newErrors.tel = t("The phone number is required.");
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const createPatient = async () => {
        if (!validateForm()) return;

        setIsSaving(true);
        try {
            const body = {
                firstName: newClientData.name,
                tel: newClientData.tel,
                cabinetDTO: {
                    id: 1,
                },
            };
            await OrderApi.createPatient(body);
            setIsAddingClient(false);
            setNewClientData({ name: "", tel: "" });
            if (selectedCabinet) {
                await fetchOrdersByCabinet(selectedCabinet);
            } else {
                await fetchOrders();
            }
        } catch (error) {
            console.error("Failed to create patient:", error);
            alert("Failed to add client. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };


    const openCnamModal = (orderId: number) => {
        setCurrentCnamOrderId(orderId);
        setNni("");
        setCnamRef("");
        setCnamErrors({nni: false});
        setIsCnamModalOpen(true);
    };

    const closeCnamModal = () => {
        setIsCnamModalOpen(false);
        setCurrentCnamOrderId(null);
    };

    const handleAddCnam = async () => {
        if(nni.length !== 10) {
            setCnamErrors({
                nni: nni.length !== 10
            });
            return;
        }

        try {
            setOrders(prev =>
                prev.map(order =>
                    order.id === currentCnamOrderId ? { ...order, hasCnam: true } : order
                )
            );

            await OrderApi.addToCnam(currentCnamOrderId, { nni });
            closeCnamModal();
        } catch (error) {
            setOrders(prev =>
                prev.map(order =>
                    order.id === currentCnamOrderId ? { ...order, hasCnam: false } : order
                )
            );
            alert(t("Failed to add CNAM information. Please try again."));
        }
    };

    const openNoteModal = (orderId: number) => {
        setCurrentOrderId(orderId);
        setNewNote("");
        setNoteErrors({note: false});
        setIsNoteModalOpen(true);
    };

    const closeNoteModal = () => {
        setIsNoteModalOpen(false);
        setCurrentOrderId(null);
        setNewNote("");
        setNoteErrors({note: false});
    };

// In saveNote function:
    const saveNote = async () => {
        if (!newNote.trim()) {
            setNoteErrors({note: true});
            return;
        }
        try {
            if (currentOrderId) {
                // Optimistic update
                setOrders(prev =>
                    prev.map(order =>
                        order.id === currentOrderId ? { ...order, note: newNote } : order
                    )
                );

                await updateOrderNote(currentOrderId, newNote);
                closeNoteModal();
            }
        } catch (error) {
            // Rollback on failure
            setOrders(prev =>
                prev.map(order =>
                    order.id === currentOrderId ? { ...order, note: order.note } : order
                )
            );
            console.error("Failed to save note:", error);
            alert(t("Failed to save note. Please try again."));
        }
    };
    useEffect(() => {
        fetchOrderCounts();
        fetchOrders();
        fetchCabinets();
    }, []);

    const fetchOrderCounts = async () => {
        try {
            const response = await OrderApi.getCountOrders();
            const apiData = response.data;
            const allStatuses = ["PENDING", "CONFIRMED", "CONSTRUCTED", "DELIVERED", "CANCELED"];
            const countMap = new Map(apiData.map((item: {
                status: string;
                count: number
            }) => [item.status, item.count]));
            const mergedData = allStatuses.map((status) => ({
                status,
                count: countMap.get(status) || 0,
            }));
            setOrderCounts(mergedData);
        } catch (error) {
            console.error("Error fetching order counts:", error);
        }
    };

    const fetchPrescriptions = async (orderId: number) => {
        setPrescriptionLoading(true);
        setViewingPrescriptions({orderId, prescriptions: []});

        try {
            const response = await OrderApi.getPrescriptionsByOrderId(orderId);
            // Simulate network delay for loader visibility
            setTimeout(() => {
                setViewingPrescriptions({orderId, prescriptions: response.data});
                setPrescriptionLoading(false);
            }, 500);

        } catch (error) {
            console.error("Failed to fetch prescriptions:", error);
            alert("Failed to fetch prescriptions. Please try again.");
            setPrescriptionLoading(false);
            setViewingPrescriptions({orderId, prescriptions: []});
        }
    };


    const openWhatsApp = (phoneNumber: string) => {
        const whatsappUrl = `https://wa.me/${phoneNumber.replace(/\D/g, "")}`;
        window.open(whatsappUrl, "_blank");
    };

    const makePhoneCall = (phoneNumber: string) => {
        window.location.href = `tel:${phoneNumber}`;
    };

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await OrderApi.getAllOrders();
            setOrders(response?.data);
        } catch {
        } finally {
            setLoading(false);
        }
    };

    const updateContactedStatus = async (orderId: number) => {
        // Capture original state for rollback
        const originalContacted = orders.find(o => o.id === orderId)?.contacted;

        // Optimistic update
        setOrders(prev =>
            prev.map(order =>
                order.id === orderId ? { ...order, contacted: true } : order
            )
        );
        setUpdatingContacted(orderId);

        try {
            await OrderApi.updateContactedStatus(orderId);
            await fetchOrderCounts(); // Update dashboard stats if needed
        } catch (error) {
            // Rollback on failure
            setOrders(prev =>
                prev.map(order =>
                    order.id === orderId ? { ...order, contacted: originalContacted } : order
                )
            );
            console.error("Failed to update contact status:", error);
            alert(t("Failed to update contact status. Please try again."));
        } finally {
            setUpdatingContacted(null);
        }
    };
    const updateOrderNote = async (orderId: number, note: string) => {
        try {
            const body = {note};
            await OrderApi.updateOrderNote(orderId, body);

        } catch (error) {
            console.error("Failed to update note:", error);
        } finally {
        }
    };

    const cancelOrder = async (orderId: number) => {
        setUpdatingStatus(orderId);
        try {
            await OrderApi.updateOrderStatus(`cancel-order/${orderId}`);
            if (selectedCabinet) {
                await fetchOrdersByCabinet(selectedCabinet);
            } else {
                await fetchOrders();
            }
            await fetchOrderCounts();
        } catch (error) {
            console.error("Failed to cancel order:", error);
        } finally {
            setUpdatingStatus(null);
        }
    };

    const fetchCabinets = async () => {
        const response = await OrderApi.getAllCabinet();
        setCabinets(response?.data);
    };

    const fetchOrdersByCabinet = async (cabinetId: number) => {
        setLoading(true);
        try {
            const response = await OrderApi.getOrdersByCabinetId(cabinetId);
            setOrders(response?.data);
        } catch {
        } finally {
            setLoading(false);
        }
    };

// In functions like updateOrderStatus, updateContactedStatus, etc.
// Replace full refetch with direct state updates:
    const updateOrderStatus = async (orderId: number, newStatus: Order["status"]) => {
        // Capture original status for rollback
        const originalStatus = orders.find(order => order.id === orderId)?.status;

        // Optimistic update
        setOrders(prev =>
            prev.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            )
        );

        try {
            let endpoint = "";
            switch (newStatus) {
                case "CONFIRMED":
                    endpoint = `confirm-order/${orderId}`;
                    break;
                case "CONSTRUCTED":
                    endpoint = `construct-order/${orderId}`;
                    break;
                case "DELIVERED":
                    endpoint = `deliver-order/${orderId}`;
                    break;
                default:
                    throw new Error("Invalid status");
            }

            await OrderApi.updateOrderStatus(endpoint);
            await fetchOrderCounts(); // Keep count updates

        } catch (error) {
            // Rollback on failure
            setOrders(prev =>
                prev.map(order =>
                    order.id === orderId ? { ...order, status: originalStatus } : order
                )
            );
            console.error("Failed to update order status:", error);
            alert(t("Status update failed. Please try again."));

        } finally {
            setUpdatingStatus(null);
        }
    };
    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(event.target.value));
        setCurrentPage(1);
    };

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const query = event.target.value.trim();
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const filteredOrders = orders.filter((order) => {
        if (selectedStatus && order.status !== selectedStatus) return false;
        if (searchQuery && !order.client.tel.includes(searchQuery)) return false;
        if (filterHasWhatsapp !== null && order.client.hasWhatsapp !== filterHasWhatsapp) return false;
        return true;
    });
    const totalPages = Math.ceil(filteredOrders.length / rowsPerPage);
    const currentRows = filteredOrders.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const isMobile = window.innerWidth < 768;

    const handleFileUpload = async (orderId: number, event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        if (file.size > 10 * 1024 * 1024) { // 10MB max
            alert('File size should be less than 10MB');
            return;
        }
        if (!file.type.match('image.*')) {
            alert('Please select an image file (JPEG, PNG)');
            return;
        }

        setUploadingPrescription(orderId);
        setOrders(prev =>
            prev.map(order =>
                order.id === orderId ? {
                    ...order,
                    prescription: 'temp_placeholder'
                } : order
            )
        );


        try {
            const compressedFile = await compressImage(file);
            console.log('Compression complete', {
                originalSize: file.size,
                compressedSize: compressedFile.size,
                reduction: `${Math.round((1 - compressedFile.size / file.size) * 100)}%`
            });

            const base64String = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => {
                    if (typeof reader.result === 'string') {
                        const base64Data = reader.result.split(',')[1] || reader.result;
                        resolve(base64Data);
                    } else {
                        reject(new Error('Could not read file as base64'));
                    }
                };
                reader.onerror = () => reject(new Error('File reading failed'));
                reader.readAsDataURL(compressedFile);
            });

            const body = {
                prescription: base64String,
                contentType: 'image/jpeg'
            };

            await OrderApi.addPrescription(orderId, body);

            setOrders(prev =>
                prev.map(order =>
                    order.id === orderId ? {
                        ...order,
                        prescription: base64String // Use actual data instead of placeholder
                    } : order
                )
            );


        } catch (error) {
            console.error('Upload failed:', {
                error: error.message,
                stack: error.stack
            });
            alert(`Upload failed: ${error.message || 'Please try again'}`);
        } finally {
            setUploadingPrescription(null);
            event.target.value = '';
        }
    };

    const displayPrescriptions = () => {
        if (!viewingPrescriptions) return null;

        const {prescriptions} = viewingPrescriptions;
        if (prescriptions.length === 0) {
            return <div className="text-gray-500 text-center py-4">{t("No prescriptions found")}</div>;
        }

        return (
            <div className="space-y-4">
                {prescriptions.map((prescription, index) => (
                    <div key={index} className="border rounded-lg p-4">
                        {prescription.prescription && (
                            <div className="w-full overflow-hidden rounded-lg shadow-md border">
                                <img
                                    src={`data:image/jpeg;base64,${prescription.prescription}`}
                                    alt="Prescription"
                                    className="w-full h-auto max-h-[75vh] object-contain"
                                />
                            </div>

                        )}
                    </div>
                ))}
            </div>
        );
    };

    const PrescriptionModal = () => {
        if (!viewingPrescriptions) return null;

        return (
            <div className="fixed inset-0 z-1000 flex justify-center items-end sm:items-center">
                <motion.div
                    initial={{x: '-100%'}}
                    animate={{x: 0}}
                    exit={{x: '-100%'}}
                    transition={{type: 'spring', stiffness: 300}}
                    className="w-4/5 sm:max-w-md h-full bg-white rounded-r-2xl shadow-xl overflow-hidden"
                >
                    <div className="relative p-4 sm:p-6 h-full overflow-y-auto max-h-screen">
                        {/* Close button and title */}
                        <button
                            className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                            onClick={() => setViewingPrescriptions(null)}
                        >
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                                <path d="M6 18L18 6M6 6l12 12"
                                      stroke="currentColor" strokeWidth={2}/>
                            </svg>
                        </button>

                        <h2 className="text-lg font-medium mb-4">{t("Prescriptions")}</h2>

                        {/* Keep primary loader, remove image-level loading */}
                        {prescriptionLoading && (
                            <div className="flex justify-center py-4">
                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}

                        {!prescriptionLoading && viewingPrescriptions.prescriptions.length === 0 && (
                            <div className="text-gray-500 text-center py-4">
                                {t("No prescriptions found")}
                            </div>
                        )}

                        <div className="space-y-4">
                            {viewingPrescriptions.prescriptions.map((prescription, index) => (
                                             <div key={index} className="relative rounded-lg overflow-hidden">
                                                   <img
                                                    src={`data:image/jpeg;base64,${prescription.prescription}`}
                                                    alt="Prescription"
                                                    className="w-full h-auto object-contain"
                                                  />
                                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    };

    return (
        <>
            {viewingPrescriptions && <PrescriptionModal/>}
            {isCnamModalOpen && (
                <div className="fixed inset-0 z-1000 overflow-y-auto">
                    <div
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={closeCnamModal}
                    />
                    {/* Background overlay */}
                    <div className="flex min-h-screen items-center justify-center px-4 pb-20 pt-4 sm:p-0">
                        <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900">
                            <h3 className="text-lg font-medium mb-4">{t("Add CNAM Information")}</h3>

                            <div className="space-y-4">
                                <input
                                    type="text"
                                    placeholder={t("NNI (10 digits)")}
                                    value={nni}
                                    onChange={(e) => {
                                        setNni(e.target.value.replace(/\D/g, ''));
                                        setCnamErrors(prev => ({...prev, nni: false}));
                                    }}
                                    maxLength={10}
                                    className={`w-full px-3 py-2 border rounded-md ${cnamErrors.nni ? 'border-red-500' : ''}`}
                                />
                                {cnamErrors.nni &&
                                    <p className="text-red-500 text-xs">{t("Invalid NNI (10 digits required)")}</p>}

                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    onClick={closeCnamModal}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                                >
                                    {t("Cancel")}
                                </button>
                                <button
                                    onClick={handleAddCnam}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    {t("Submit")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

            )}
            {isNoteModalOpen && (
                <div className="fixed inset-0 z-1000 overflow-y-auto">
                    <div
                        className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        {/* Background Overlay */}
                        <div
                            className="fixed inset-0 transition-opacity"
                            aria-hidden="true"
                            onClick={closeNoteModal}
                        >
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>

                        {/* Modal Content */}
                        <div
                            className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                            <textarea
                                placeholder={t("Enter note here")}
                                value={newNote}
                                onChange={(e) => setNewNote(e.target.value)}
                                rows={4}
                                className="w-full min-w-[280px] rounded-md border border-gray-300 px-4 py-3 text-base shadow-theme-xs focus:ring-indigo-500 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            />
                                        {noteErrors.note && (
                                            <p className="mt-1 text-xs text-red-600">{t("Note is required")}</p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={saveNote}
                                >
                                    {t("Save")}
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                                    onClick={closeNoteModal}
                                >
                                    {t("Cancel")}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            {isAddingClient && (<div className="fixed inset-0 z-1000 overflow-y-auto">
                <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                    <div
                        className="fixed inset-0 transition-opacity"
                        aria-hidden="true"
                        onClick={() => setIsAddingClient(false)}
                    >
                        <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                    </div>

                    <div
                        className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            <div className="sm:flex sm:items-start">
                                <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                                        {t("Add New Client")}
                                    </h3>
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <input
                                                type="text"
                                                name="name"
                                                placeholder={t("Full Name")}
                                                value={newClientData.name}
                                                onChange={handleInputChange}
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-theme-xs focus:ring-indigo-500 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                            />
                                            {errors.name && (
                                                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                                            )}
                                        </div>
                                        <div>
                                            <input
                                                type="text"
                                                name="tel"
                                                placeholder={t("Phone Number")}
                                                value={newClientData.tel}
                                                onChange={handleInputChange}
                                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-theme-xs focus:ring-indigo-500 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                            />
                                            {errors.tel && (
                                                <p className="text-red-500 text-sm mt-1">{errors.tel}</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                            <button
                                type="button"
                                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                                onClick={createPatient}
                            >
                                {isSaving ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    t("Save")
                                )}
                            </button>
                            <button
                                type="button"
                                className="mt-3 ml-2 mr-2 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm"
                                onClick={() => setIsAddingClient(false)}
                            >
                                {t("Cancel")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>)}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
                {orderCounts.map(({status, count}) => {
                    const statusConfig = {
                        PENDING: {
                            icon: (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                                     viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            ),
                            bgColor: "bg-yellow-100 dark:bg-yellow-800",
                            textColor: "text-yellow-600 dark:text-yellow-300",
                            label: t("Pending Orders")
                        },
                        CONFIRMED: {
                            icon: (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                                     viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                </svg>
                            ),
                            bgColor: "bg-green-100 dark:bg-green-800",
                            textColor: "text-green-600 dark:text-green-300",
                            label: t("Confirmed Orders")
                        },
                        CONSTRUCTED: {
                            icon: (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                                     viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
                                </svg>
                            ),
                            bgColor: "bg-blue-100 dark:bg-blue-800",
                            textColor: "text-blue-600 dark:text-blue-300",
                            label: t("Glasses Ready")
                        },
                        DELIVERED: {
                            icon: (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                                     viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M5 13l4 4L19 7"/>
                                </svg>
                            ),
                            bgColor: "bg-purple-100 dark:bg-purple-800",
                            textColor: "text-purple-600 dark:text-purple-300",
                            label: t("Delivered Orders")
                        },
                        CANCELED: {
                            icon: (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none"
                                     viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M6 18L18 6M6 6l12 12"/>
                                </svg>
                            ),
                            bgColor: "bg-red-100 dark:bg-red-800",
                            textColor: "text-red-600 dark:text-red-300",
                            label: t("Canceled Orders")
                        }
                    };

                    const config = statusConfig[status] || statusConfig.PENDING;

                    return (
                        <div
                            key={status}
                            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
                        >
                            <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${config.bgColor}`}>
          <span className={config.textColor}>
            {config.icon}
          </span>
                            </div>
                            <div className="mt-4">
                                <h4 className={`text-lg font-bold ${config.textColor}`}>
                                    {count}
                                </h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {config.label}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>


            <div
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
                <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                            {t("Orders")} {filteredOrders?.length}
                        </h3>
                    </div>
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <label htmlFor="search" className="text-sm text-gray-500 dark:text-gray-400">
                            {t("Search by Phone")}:
                        </label>
                        <input
                            id="search"
                            type="text"
                            placeholder={t("Enter phone number")}
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:focus:ring-indigo-600"
                        />
                        <label htmlFor="cabinetFilter" className="text-sm text-gray-500 dark:text-gray-400">
                            {t("Filter by Cabinet")}:
                        </label>
                        <select
                            id="cabinetFilter"
                            value={selectedCabinet || ""}
                            onChange={(event) => {
                                const cabinetId = event.target.value;
                                if (cabinetId === "") {
                                    fetchOrders();
                                } else {
                                    fetchOrdersByCabinet(Number(cabinetId));
                                }
                                setSelectedCabinet(cabinetId === "" ? null : Number(cabinetId));
                            }}
                            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:focus:ring-indigo-600"
                        >
                            <option value="">{t("All Cabinets")}</option>
                            {cabinets.map((cabinet) => (
                                <option key={cabinet?.id} value={cabinet?.id}>
                                    {cabinet?.name}
                                </option>
                            ))}
                        </select>
                        <label htmlFor="statusFilter" className="text-sm text-gray-500 dark:text-gray-400">
                            {t("Filter by Status")}:
                        </label>
                        <select
                            id="statusFilter"
                            value={selectedStatus || ""}
                            onChange={(event) => {
                                const status = event.target.value as Order["status"];
                                setSelectedStatus(status === "" ? null : status);
                                setCurrentPage(1);
                            }}
                            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:focus:ring-indigo-600"
                        >
                            <option value="">{t("All Statuses")}</option>
                            <option value="PENDING">{t("Pending")}</option>
                            <option value="CONFIRMED">{t("Confirmed")}</option>
                            <option value="CONSTRUCTED">{t("Constructed")}</option>
                            <option value="DELIVERED">{t("Delivered")}</option>
                            <option value="CANCELED">{t("Canceled")}</option>
                        </select>

                        <label htmlFor="whatsappFilter" className="text-sm text-gray-500 dark:text-gray-400">
                            {t("WhatsApp")}:
                        </label>
                        <select
                            id="whatsappFilter"
                            value={filterHasWhatsapp === null ? "" : filterHasWhatsapp.toString()}
                            onChange={(e) => {
                                const value = e.target.value;
                                setFilterHasWhatsapp(value === "" ? null : value === "true");
                            }}
                            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:focus:ring-indigo-600"
                        >
                            <option value="">{t("All")}</option>
                            <option value="true">{t("Has WhatsApp")}</option>
                            <option value="false">{t("No WhatsApp")}</option>
                        </select>
                    </div>
                    <button
                        onClick={() => setIsAddingClient(true)}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        {t("Add")}
                    </button>
                </div>

                {isMobile ? (
                    <div className="space-y-4">
                        {loading && (
                            <div className="flex justify-center items-center">
                                <div
                                    className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"/>
                            </div>
                        )}
                        {!loading && filteredOrders.length === 0 && (
                            <div className="text-center text-gray-500 dark:text-gray-400">{t("No data available")}</div>
                        )}
                        {!loading &&
                            currentRows.map((order) => (
                                <div
                                    key={order.id}
                                    className="p-4 bg-white rounded-lg shadow-md dark:bg-gray-800"
                                >


                                    <div className="flex justify-between">
                                        <p className="font-medium text-gray-800 dark:text-white/90">
                                            #{order.id} - {order.client.firstName}
                                        </p>
                                        <Badge
                                            size="sm"
                                            color={
                                                order.status === "PENDING"
                                                    ? "pending"
                                                    : order.status === "CONFIRMED"
                                                        ? "confirmed"
                                                        : order.status === "CONSTRUCTED"
                                                            ? "ready"
                                                            : order.status === "DELIVERED"
                                                                ? "delivered"
                                                                : "canceled"
                                            }
                                        >
                                            {t(order.status)}
                                        </Badge>
                                        <Badge
                                            size="sm"
                                            color={order.patientStatus === "DIRECT" ? "confirmed" : "pending"}
                                        >
                                            {t(order.patientStatus)}
                                        </Badge>
                                    </div>
                                    <p className="text-md text-gray-700 dark:text-gray-400 flex flex-row">
                                        <img
                                            src={order?.client?.hasWhatsapp ? "/images/whatsapp.png" : "/images/call.webp"}
                                            alt={order?.client?.hasWhatsapp ? "WhatsApp" : "Phone"}
                                            className="w-6 h-6 mr-2"
                                            onClick={() => {
                                                if (order?.client?.hasWhatsapp) {
                                                    openWhatsApp("+222" + order.client.tel);
                                                } else {
                                                    makePhoneCall("+222" + order.client.tel);
                                                }
                                            }}
                                        /> {" " + order.client.tel}
                                    </p>
                                    <p className="text-md text-gray-700 dark:text-gray-400">
                                        {order.client?.cabinetDTO?.name}
                                    </p>
                                    <p className="text-md text-gray-700 dark:text-gray-400">
                                        {new Date(order.createdAt).toLocaleDateString("fr-FR", {
                                                year: "numeric",
                                                month: "long",
                                                day: "numeric",
                                            }) +
                                            " " +
                                            new Date(order.createdAt).toLocaleTimeString("fr-FR", {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                    </p>
                                    <div className="mt-2 flex justify-between items-center flex-row">
                                        <div>
                                            {order.status === "PENDING" && (
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, "CONFIRMED")}
                                                    disabled={updatingStatus === order.id}
                                                    className={`inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                        updatingStatus === order.id
                                                            ? "bg-transparent text-gray-500 cursor-not-allowed"
                                                            : "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500"
                                                    }`}
                                                >
                                                    {updatingStatus === order.id ? (
                                                        <div
                                                            className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"/>
                                                    ) : (
                                                        t("Confirm")
                                                    )}
                                                </button>
                                            )}
                                            {order.status === "CONFIRMED" && (
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, "CONSTRUCTED")}
                                                    disabled={updatingStatus === order.id}
                                                    className={`inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                        updatingStatus === order.id
                                                            ? "bg-transparent text-gray-500 cursor-not-allowed"
                                                            : "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500"
                                                    }`}
                                                >
                                                    {updatingStatus === order.id ? (
                                                        <div
                                                            className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"/>
                                                    ) : (
                                                        t("Ready")
                                                    )}
                                                </button>
                                            )}
                                            {order.status === "CONSTRUCTED" && (
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, "DELIVERED")}
                                                    disabled={updatingStatus === order.id}
                                                    className={`inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                        updatingStatus === order.id
                                                            ? "bg-transparent text-gray-500 cursor-not-allowed"
                                                            : "bg-purple-500 text-white hover:bg-purple-600 focus:ring-purple-500"
                                                    }`}
                                                >
                                                    {updatingStatus === order.id ? (
                                                        <div
                                                            className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"/>
                                                    ) : (
                                                        t("Deliver")
                                                    )}
                                                </button>
                                            )}
                                            {order.status === "DELIVERED" && (
                                                <span className="text-gray-400">{t("Completed")}</span>
                                            )}
                                            {(order.status === "PENDING") && (
                                                <button
                                                    onClick={() => cancelOrder(order.id)}
                                                    disabled={updatingStatus === order.id}
                                                    className={`ml-2 inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                        updatingStatus === order.id
                                                            ? "bg-transparent text-gray-500 cursor-not-allowed"
                                                            : "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
                                                    }`}
                                                >
                                                    {updatingStatus === order.id ? (
                                                        <div
                                                            className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"/>
                                                    ) : (
                                                        t("Cancel")
                                                    )}
                                                </button>
                                            )}

                                            <div className="mt-3">
                                                {order.contacted ? (
                                                    <div
                                                        className="inline-flex items-center px-3 py-1.5 rounded-md bg-green-50 text-green-700">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1"
                                                             viewBox="0 0 20 20" fill="currentColor">
                                                            <path fillRule="evenodd"
                                                                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                                  clipRule="evenodd"/>
                                                        </svg>
                                                        {t("Contacted")}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => updateContactedStatus(order.id)}
                                                        disabled={updatingContacted === order.id}
                                                        className={`inline-flex items-center px-4 py-2 rounded-md 
            ${updatingContacted === order.id
                                                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                                                    >
                                                        {updatingContacted === order.id ? (
                                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent
                           rounded-full animate-spin mr-2" />
                                                        ) : (
                                                            t("Mark as Contacted")
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3 jus">
                                            {
                                                order && (
                                                    <div>
                                                        <button
                                                            onClick={() => fetchPrescriptions(order.id)}
                                                            className="text-indigo-600 hover:text-indigo-800"
                                                            title={t("View Prescriptions")}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6"
                                                                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                                      strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                                      strokeWidth={2}
                                                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                                            </svg>
                                                        </button>

                                                        <label className="cursor-pointer text-blue-500 hover:text-blue-700">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                className="hidden"
                                                                onChange={(e) => handleFileUpload(order.id, e)}
                                                                disabled={uploadingPrescription === order.id}
                                                            />
                                                            {uploadingPrescription === order.id ? (
                                                                <div
                                                                    className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"/>
                                                            ) : (
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6"
                                                                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round"
                                                                          strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                                                                </svg>
                                                            )}

                                                        </label>
                                                        {order.hasCnam ? (
                                                            <img
                                                                src="/images/logo/logocnam.png"
                                                                alt="CNAM"
                                                                className="w-8 h-8 mt-5"
                                                                title="CNAM Registered"
                                                                aria-disabled={true}
                                                            />
                                                        ) : (
                                                            <button
                                                                onClick={() => openCnamModal(order.id)}
                                                                className="flex items-center  px-1.5 py-1.5 bg-blue-50 text-blue-700
                rounded-md hover:bg-blue-100 transition-colors mt-5"
                                                            >
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                                                </svg>
                                                                {t("CNAM")}
                                                            </button>
                                                        )}
                                                    </div>

                                                )
                                            }
                                        </div>
                                    </div>
                                    {
                                        !order.note ? (
                                            <button
                                                onClick={() => openNoteModal(order.id)}
                                                className="mt-2 inline-flex items-center px-4 py-2 rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                            >
                                                <svg
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    className="h-5 w-5 mr-1"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                                {t("Add Note")}
                                            </button>
                                        ) : (
                                            <div
                                                onClick={() => {
                                                    setNewNote(order.note || ""); // Pre-fill the note
                                                    setIsEditingNote(true); // Set editing mode
                                                    setCurrentOrderId(order.id); // Set the current order ID
                                                    setIsNoteModalOpen(true); // Open the modal
                                                }}
                                                className="mt-2 p-2 bg-gray-50 rounded-md cursor-pointer hover:bg-gray-100 transition-colors"
                                            >
                                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                                    {t("Note")}: {order.note}
                                                </p>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent triggering the parent div's click
                                                        setNewNote(order.note || ""); // Pre-fill the note
                                                        setIsEditingNote(true); // Set editing mode
                                                        setCurrentOrderId(order.id); // Set the current order ID
                                                        setIsNoteModalOpen(true); // Open the modal
                                                    }}
                                                    className="absolute top-2 right-2 text-indigo-600 hover:text-indigo-800"
                                                    title={t("Edit Note")}
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5"
                                                        viewBox="0 0 20 20"
                                                        fill="currentColor"
                                                    >
                                                        <path
                                                            d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"
                                                        />
                                                    </svg>
                                                </button>
                                            </div>
                                        )
                                    }
                                </div>
                            ))}
                    </div>
                ) : (
                    <div className="max-w-full overflow-x-auto">
                        <Table>
                            <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
                                <TableRow>

                                    <TableCell
                                        isHeader
                                        className="py-3 font-bold text-md text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        {t("Name")}
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="py-3 font-bold text-md text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        {t("Phone")}
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="py-3 font-bold text-md text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        {t("Patient Status")}
                                    </TableCell>
                                    <TableCell isHeader className="py-3 font-bold text-md text-gray-500 text-start text-theme-xs dark:text-gray-400">
                                        {t("CNAM")}
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="py-3 font-bold text-md text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        {t("Contact")}
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="py-3 font-bold text-md text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        {t("Cabinet")}
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="py-3 font-bold text-md text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        {t("Status")}
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="py-3 font-bold text-md text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        {t("Date")}
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="py-3 font-bold text-md text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        {t("Note")}
                                    </TableCell>

                                    <TableCell
                                        isHeader
                                        className="py-3 font-bold text-md text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        {t("Action")}
                                    </TableCell>
                                    <TableCell
                                        isHeader
                                        className="py-3 font-bold text-md text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                    >
                                        {t("Prescription")}
                                    </TableCell>
                                </TableRow>
                            </TableHeader>
                            <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {loading && (
                                    <TableRow>
                                        <TableCell colSpan={8} className="py-6 text-center">
                                            <div className="flex justify-center items-center">
                                                <div
                                                    className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"/>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && filteredOrders.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={8}
                                                   className="py-6 text-center text-gray-500 dark:text-gray-400">
                                            {t("No data available")}
                                        </TableCell>
                                    </TableRow>
                                )}
                                {!loading && filteredOrders.length > 0 && currentRows.map((order) => (
                                    <TableRow key={order.id} className="">

                                        <TableCell className="py-3">
                                            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                                {order.client.firstName}
                                            </p>
                                        </TableCell>
                                        <TableCell
                                            className="py-3 font-bold text-gray-500 text-theme-sm dark:text-gray-400">
                                            <img
                                                src={order?.client?.hasWhatsapp ? "/images/whatsapp.png" : "/images/call.webp"}
                                                alt={order?.client?.hasWhatsapp ? "WhatsApp" : "Phone"}
                                                className="w-6 h-6 inline-block mr-2"
                                            />
                                            {order.client.tel}
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            <Badge
                                                size="sm"
                                                color={order.patientStatus === "DIRECT" ? "confirmed" : "pending"}
                                            >
                                                {t(order.patientStatus)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            {order.hasCnam ? (
                                                <img
                                                    src="/images/logo/logocnam.png"
                                                    alt="CNAM"
                                                    className="w-8 h-8"
                                                    title="CNAM Registered"
                                                />
                                            ) : (
                                                <button
                                                   onClick={() => openCnamModal(order.id)}
                                                    className="flex items-center  px-1.5 py-1.5 bg-blue-50 text-blue-700
                rounded-md hover:bg-blue-100 transition-colors"
                                                >
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                                                    </svg>
                                                    {t("CNAM")}
                                                </button>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            {order.contacted ? (
                                                <div
                                                    className="inline-flex items-center px-3 py-1 rounded-md bg-green-50 text-green-700">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1"
                                                         viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd"
                                                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                              clipRule="evenodd"/>
                                                    </svg>

                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => updateContactedStatus(order.id)}
                                                    disabled={updatingContacted === order.id}
                                                    className={`inline-flex items-center px-3 py-1  rounded-md 
        ${updatingContacted === order.id
                                                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                                        : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                                                    title={t("Mark as Contacted")} // Add tooltip for accessibility
                                                >
                                                    {updatingContacted === order.id ? (
                                                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent
                       rounded-full animate-spin"/>
                                                    ) : (
                                                        <svg
                                                            xmlns="http://www.w3.org/2000/svg"
                                                            className="h-4 w-4 mr-1"
                                                            viewBox="0 0 20 20"
                                                            fill="currentColor"
                                                        >
                                                            <path
                                                                fillRule="evenodd"
                                                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                                                clipRule="evenodd"
                                                            />
                                                        </svg>
                                                    )}
                                                </button>
                                            )}
                                        </TableCell>
                                        <TableCell
                                            className="py-3 font-bold text-gray-500 text-theme-sm dark:text-gray-400">
                                            {order.client?.cabinetDTO?.name}
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            <Badge
                                                size="sm"
                                                color={
                                                    order.status === "PENDING"
                                                        ? "pending"
                                                        : order.status === "CONFIRMED"
                                                            ? "confirmed"
                                                            : order.status === "CONSTRUCTED"
                                                                ? "ready"
                                                                : order.status === "DELIVERED"
                                                                    ? "delivered"
                                                                    : "canceled"
                                                }
                                            >
                                                {t(order.status)}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            {
                                                new Date(order.createdAt).toLocaleDateString("fr-FR", {
                                                    year: "numeric",
                                                    month: "numeric",
                                                    day: "numeric",
                                                }) +
                                                " " +
                                                new Date(order.createdAt).toLocaleTimeString("fr-FR", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                })
                                            }
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            <div className="flex items-center space-x-1">
                                                <button
                                                    onClick={() => {
                                                        setCurrentOrderId(order.id);
                                                        setNewNote(order.note || "");
                                                        setIsEditingNote(true);
                                                        setIsNoteModalOpen(true);
                                                    }}
                                                    title={order.note || t("Add note")}
                                                    className="text-gray-500 hover:text-indigo-600 transition"
                                                >
                                                    <svg
                                                        xmlns="http://www.w3.org/2000/svg"
                                                        className="h-5 w-5"
                                                        fill="none"
                                                        viewBox="0 0 24 24"
                                                        stroke="currentColor"
                                                    >
                                                        <path
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                            strokeWidth={2}
                                                            d={order.note ? "M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 4v16m8-8H4"}
                                                        />
                                                    </svg>
                                                </button>

                                                {order.note ? (
                                                        <span
                                                            className="truncate max-w-[80px] text-sm text-gray-600 dark:text-gray-300"
                                                            title={order.note}>
        {order.note.length > 25 ? `${order.note.slice(0, 25)}...` : order.note}
      </span>
                                                    ) :
                                                    <span
                                                        className="truncate max-w-[80px] text-sm text-gray-600 dark:text-gray-300"
                                                        title={order.note}>
        {'Note'}
      </span>
                                                }
                                            </div>
                                        </TableCell>


                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            {order.status === "PENDING" && (
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, "CONFIRMED")}
                                                    disabled={updatingStatus === order.id}
                                                    className={`inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                        updatingStatus === order.id
                                                            ? "bg-transparent text-gray-500 cursor-not-allowed"
                                                            : "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500"
                                                    }`}
                                                >
                                                    {updatingStatus === order.id ? (
                                                        <div
                                                            className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"/>
                                                    ) : (
                                                        t("Confirm")
                                                    )}
                                                </button>
                                            )}
                                            {order.status === "CONFIRMED" && (
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, "CONSTRUCTED")}
                                                    disabled={updatingStatus === order.id}
                                                    className={`inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                        updatingStatus === order.id
                                                            ? "bg-transparent text-gray-500 cursor-not-allowed"
                                                            : "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500"
                                                    }`}
                                                >
                                                    {updatingStatus === order.id ? (
                                                        <div
                                                            className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"/>
                                                    ) : (
                                                        t("Mark as Ready")
                                                    )}
                                                </button>
                                            )}
                                            {order.status === "CONSTRUCTED" && (
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, "DELIVERED")}
                                                    disabled={updatingStatus === order.id}
                                                    className={`inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 pl-3 pr-3 ${
                                                        updatingStatus === order.id
                                                            ? "bg-transparent text-gray-500 cursor-not-allowed"
                                                            : "bg-purple-500 text-white hover:bg-purple-600 focus:ring-purple-500"
                                                    }`}
                                                >
                                                    {updatingStatus === order.id ? (
                                                        <div
                                                            className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"/>
                                                    ) : (
                                                        t("Deliver")
                                                    )}
                                                </button>
                                            )}
                                            {order.status === "DELIVERED" ? (
                                                <span className="text-gray-400">{t("Completed")}</span>
                                            )
                                            : (order.status === "PENDING") && (
                                                <button
                                                    onClick={() => cancelOrder(order.id)}
                                                    disabled={updatingStatus === order.id}
                                                    className={`ml-2 inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                        updatingStatus === order.id
                                                            ? "bg-transparent text-gray-500 cursor-not-allowed"
                                                            : "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
                                                    }`}
                                                >
                                                    {updatingStatus === order.id ? (
                                                        <div
                                                            className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"/>
                                                    ) : (
                                                        t("Cancel")
                                                    )}
                                                </button>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            {
                                                order && (
                                                    <div className={"flex flex-row"}>
                                                        <button
                                                            onClick={() => fetchPrescriptions(order.id)}
                                                            className="text-indigo-600 hover:text-indigo-800"
                                                            title={t("View Prescriptions")}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6"
                                                                 fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                                      strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                                                <path strokeLinecap="round" strokeLinejoin="round"
                                                                      strokeWidth={2}
                                                                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                                                            </svg>
                                                        </button>

                                                        <label className="cursor-pointer text-blue-500 hover:text-blue-700">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                capture="environment"
                                                                className="hidden"
                                                                onChange={(e) => handleFileUpload(order.id, e)}
                                                                disabled={uploadingPrescription === order.id}
                                                            />
                                                            {uploadingPrescription === order.id ? (
                                                                <div
                                                                    className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"/>
                                                            ) : (
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6"
                                                                     fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round"
                                                                          strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
                                                                </svg>
                                                            )}
                                                        </label>
                                                    </div>
                                                )
                                            }
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}

                <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            {t("Rows per page")}:
                        </div>
                        <select
                            value={rowsPerPage}
                            onChange={handleRowsPerPageChange}
                            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:focus:ring-indigo-600"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                            {t("Page")} {currentPage} {t("of")} {totalPages}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                        >
                            {t("Previous")}
                        </button>
                        <button
                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
                        >
                            {t("Next")}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
