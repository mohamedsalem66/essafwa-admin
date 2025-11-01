"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import {
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { HiEye, HiPencil, HiTrash } from "react-icons/hi2";
import {MarketingApi, MarketingDTO} from "@/app/api/MarketingApi";

const Picker = dynamic(() => import("emoji-picker-react").then(m => m.default), {
    ssr: false,
});

interface Message {
    id?: number;
    title: string;
    message: string;         // French message
    arabicMessage: string;   // Arabic message
}

export default function Messages() {
    const [messages, setMessages] = useState<MarketingDTO[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<"add" | "edit" | "view">("add");
    const [currentMessage, setCurrentMessage] = useState<MarketingDTO | null>(null);

    const [newTitle, setNewTitle] = useState("");
    const [newFrenchText, setNewFrenchText] = useState("");
    const [newArabicText, setNewArabicText] = useState("");

    const [errors, setErrors] = useState({
        title: false,
        fr: false,
        ar: false,
    });

    const [showFrenchPicker, setShowFrenchPicker] = useState(false);
    const [showArabicPicker, setShowArabicPicker] = useState(false);

    const frenchPickerRef = useRef<HTMLDivElement>(null);
    const arabicPickerRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        loadMessages();
    }, []);

    const loadMessages = async () => {
        try {
            const data = await MarketingApi.getAllMarketing();
            setMessages(data);
        } catch (error) {
            console.error("Failed to fetch messages:", error);
        }
    };


    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                showFrenchPicker &&
                frenchPickerRef.current &&
                !frenchPickerRef.current.contains(e.target as Node)
            ) {
                setShowFrenchPicker(false);
            }
            if (
                showArabicPicker &&
                arabicPickerRef.current &&
                !arabicPickerRef.current.contains(e.target as Node)
            ) {
                setShowArabicPicker(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [showFrenchPicker, showArabicPicker]);

    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const totalPages = Math.max(1, Math.ceil(messages.length / rowsPerPage));

    const currentMessages = useMemo(() => {
        const start = (currentPage - 1) * rowsPerPage;
        const end = currentPage * rowsPerPage;
        return messages.slice(start, end);
    }, [messages, currentPage, rowsPerPage]);

    const openAdd = () => {
        setModalMode("add");
        setIsModalOpen(true);
        resetForm();
    };

    const openEdit = (msg: MarketingDTO) => {
        setModalMode("edit");
        setCurrentMessage(msg);
        setNewTitle(msg.title);
        setNewFrenchText(msg.message);
        setNewArabicText(msg.arabicMessage);
        setErrors({ title: false, fr: false, ar: false });
        setIsModalOpen(true);
    };

    const openView = (msg: Message) => {
        setModalMode("view");
        setCurrentMessage(msg);
        setNewTitle(msg.title);
        setNewFrenchText(msg.message);
        setNewArabicText(msg.arabicMessage);
        setErrors({ title: false, fr: false, ar: false });
        setIsModalOpen(true);
    };


    const saveMessage = async () => {
        if (!newTitle || !newFrenchText || !newArabicText) {
            setErrors({
                title: !newTitle,
                fr: !newFrenchText,
                ar: !newArabicText,
            });
            return;
        }

        const payload: MarketingDTO = {
            title: newTitle,
            message: newFrenchText,
            arabicMessage: newArabicText,
        };

        try {
            if (modalMode === "add") {
                await MarketingApi.createMarketing(payload);
            } else if (modalMode === "edit" && currentMessage) {
                await MarketingApi.updateMarketing(currentMessage.id, payload);
            }
            await loadMessages();
            closeModal();
        } catch (e) {
            console.error("Failed to save message:", e);
        }
    };

    const deleteMessage = async (id: number | undefined) => {
        try {
            await MarketingApi.deleteMarketing(id);
            await loadMessages();
        } catch (e) {
            console.error("Failed to delete message:", e);
        }
    };


    const closeModal = () => {
        setIsModalOpen(false);
        resetForm();
        setShowFrenchPicker(false);
        setShowArabicPicker(false);
    };

    const resetForm = () => {
        setNewTitle("");
        setNewFrenchText("");
        setNewArabicText("");
        setErrors({ title: false, fr: false, ar: false });
        setCurrentMessage(null);
    };

    const truncate = (txt: string, len: number) =>
        txt.length > len ? `${txt.slice(0, len)}…` : txt;

    /* ---------------- render ---------------- */
    return (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-4 pt-5 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
            {/* header */}
            <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        Messages&nbsp;({messages.length})
                    </h3>
                    <div className="mt-1 flex items-center gap-2 text-sm">
                        <label htmlFor="rpp" className="text-gray-500 dark:text-gray-400">
                            Lignes :
                        </label>
                        <select
                            id="rpp"
                            value={rowsPerPage}
                            onChange={e => {
                                setRowsPerPage(+e.target.value);
                                setCurrentPage(1);
                            }}
                            className="rounded-md border border-gray-300 bg-white px-2 py-1 shadow-theme-xs focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                        >
                            {[5, 10, 15, 30].map(opt => (
                                <option key={opt}>{opt}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <button
                    onClick={openAdd}
                    className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                    +&nbsp;Ajouter
                </button>
            </div>

            <div className="max-w-full overflow-x-auto">
                <Table>
                    <TableHeader className="border-y border-gray-100 dark:border-gray-800">
                        <TableRow>
                            {[
                                "Titre",
                                "Texte FR",
                                "النص AR",
                                "Actions",
                            ].map(h => (
                                <TableCell
                                    key={h}
                                    isHeader
                                    className="py-3 text-start text-sm font-semibold text-gray-600 dark:text-gray-400"
                                >
                                    {h}
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHeader>

                    <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {currentMessages.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={4} className="py-6 text-center text-gray-500">
                                    Aucun message
                                </TableCell>
                            </TableRow>
                        )}

                        {currentMessages.map(msg => (
                            <TableRow key={msg.id}>
                                <TableCell>{truncate(msg.title, 20)}</TableCell>
                                <TableCell>{truncate(msg.message, 30)}</TableCell>
                                <TableCell>{truncate(msg.arabicMessage, 30)}</TableCell>
                                <TableCell className="space-x-1 whitespace-nowrap">
                                    <button
                                        onClick={() => openView(msg)}
                                        title="Voir"
                                        className="inline-flex items-center rounded-full bg-gray-100 p-2 text-xs text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        <HiEye className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => openEdit(msg)}
                                        title="Modifier"
                                        className="inline-flex items-center rounded-full bg-gray-100 p-2 text-xs text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                                    >
                                        <HiPencil className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => confirm("Supprimer") && deleteMessage(msg.id)}
                                        title="Supprimer"
                                        className="inline-flex items-center rounded-full bg-red-100 p-2 text-xs text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/60"
                                    >
                                        <HiTrash className="h-4 w-4" />
                                    </button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-gray-500 dark:text-gray-400">
          Page {currentPage}/{totalPages}
        </span>
                <div className="space-x-2">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1 shadow-theme-xs enabled:hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800"
                    >
                        ←Précédent
                    </button>
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1 shadow-theme-xs enabled:hover:bg-gray-50 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800"
                    >
                        Suivant→
                    </button>
                </div>
            </div>

            {/* modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                    <div className="w-full max-w-2xl rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                        <h4 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white/90">
                            {modalMode === "add"
                                ? "Ajouter un message"
                                : modalMode === "edit"
                                    ? "Modifier le message"
                                    : "Message"}
                        </h4>

                        {/* form */}
                        <div className="space-y-4">
                            <div>
                                <input
                                    type="text"
                                    placeholder="Titre"
                                    value={newTitle}
                                    onChange={e => setNewTitle(e.target.value)}
                                    disabled={modalMode === "view"}
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-theme-xs focus:ring-indigo-500 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                                />
                                {errors.title && (
                                    <p className="mt-1 text-xs text-red-600">Titre requis</p>
                                )}
                            </div>

                            <div className="relative">
                <textarea
                    placeholder="Texte en français"
                    value={newFrenchText}
                    onChange={e => setNewFrenchText(e.target.value)}
                    disabled={modalMode === "view"}
                    rows={4}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-theme-xs focus:ring-indigo-500 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                />
                                {modalMode !== "view" && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setShowFrenchPicker(p => !p);
                                                setShowArabicPicker(false);
                                            }}
                                            className="absolute right-2 top-2 text-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                        >
                                            😊
                                        </button>
                                        {showFrenchPicker && (
                                            <div
                                                ref={frenchPickerRef}
                                                className="absolute right-0 top-full mb-2 z-20"
                                            >
                                                <Picker
                                                    emojiStyle="google"
                                                    onEmojiClick={e => setNewFrenchText(prev => prev + e.emoji)}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                                {errors.fr && (
                                    <p className="mt-1 text-xs text-red-600">Texte requis</p>
                                )}
                            </div>

                            {/* arabic textarea */}
                            <div className="relative">
                <textarea
                    placeholder="النص بالعربية"
                    value={newArabicText}
                    onChange={e => setNewArabicText(e.target.value)}
                    disabled={modalMode === "view"}
                    rows={4}
                    dir="rtl"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-theme-xs focus:ring-indigo-500 disabled:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                />
                                {modalMode !== "view" && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setShowArabicPicker(p => !p);
                                                setShowFrenchPicker(false);
                                            }}
                                            className="absolute left-2 bottom-4 text-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                                        >
                                            😊
                                        </button>
                                        {showArabicPicker && (
                                            <div
                                                ref={arabicPickerRef}
                                                className="absolute left-0 top-full mb-2 z-999"
                                            >
                                                <Picker
                                                    emojiStyle="google"
                                                    onEmojiClick={e => setNewArabicText(prev => prev + e.emoji)}
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                                {errors.ar && (
                                    <p className="mt-1 text-xs text-red-600">النص مطلوب</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-2">
                            <button
                                onClick={closeModal}
                                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
                            >
                                Annuler
                            </button>
                            {modalMode !== "view" && (
                                <button
                                    onClick={saveMessage}
                                    className="rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                >
                                    Enregistrer
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
