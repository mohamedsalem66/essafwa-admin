"use client"

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Table, TableHeader, TableRow, TableCell, TableBody } from "@/components/ui/table";
import Badge from "@/components/ui/badge/Badge";
import {OpticApi} from "@/app/api/OpticApi";

interface Optic {
    id: number;
    opticName: string;
    firstName: string;
    lastName: string;
    tel: string;
    email: string | null;
    verified: boolean;
    autoValidate: boolean;
    createdAt: string;
    updatedAt: string;
}

export default function OpticsList() {
    const { t } = useTranslation();
    const [optics, setOptics] = useState<Optic[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [rowsPerPage, setRowsPerPage] = useState(25);
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);
    const [updatingAutoValidate, setUpdatingAutoValidate] = useState<number | null>(null);

    useEffect(() => {
        fetchOptics();
    }, []);

    const fetchOptics = async () => {
        setLoading(true);
        try {
            const response = await OpticApi.getAllOptics();
            setOptics(response?.data);
        } catch (error) {
            console.error("Failed to fetch optics:", error);
            alert(t("Failed to fetch optics. Please try again."));
        } finally {
            setLoading(false);
        }
    };

    const handleActivate = async (opticId: number) => {
        setUpdatingStatus(opticId);
        try {
            await OpticApi.activeOptic(opticId);
            setOptics((prev) =>
                prev.map((optic) =>
                    optic.id === opticId ? { ...optic, verified: true } : optic
                )
            );
        } catch (error) {
            console.error("Failed to activate optic:", error);
            alert(t("Failed to activate optic. Please try again."));
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleDeactivate = async (opticId: number) => {
        setUpdatingStatus(opticId);
        try {
            await OpticApi.deactivateOptic(opticId);
            setOptics((prev) =>
                prev.map((optic) =>
                    optic.id === opticId ? { ...optic, verified: false } : optic
                )
            );
        } catch (error) {
            console.error("Failed to deactivate optic:", error);
            alert(t("Failed to deactivate optic. Please try again."));
        } finally {
            setUpdatingStatus(null);
        }
    };


    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const query = event.target.value.trim();
        setSearchQuery(query);
        setCurrentPage(1);
    };

    const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setRowsPerPage(Number(event.target.value));
        setCurrentPage(1);
    };

    const filteredOptics = optics.filter((optic) => {
        if (searchQuery && !optic.tel.includes(searchQuery) && !optic.opticName.toLowerCase().includes(searchQuery.toLowerCase())) {
            return false;
        }
        return true;
    });

    const totalPages = Math.ceil(filteredOptics.length / rowsPerPage);
    const currentRows = filteredOptics.slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage);

    const isMobile = window.innerWidth < 768;

    return (
        <div
            className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 dark:border-gray-800 dark:bg-white/[0.03] sm:px-6"
        >
            <div className="flex flex-col gap-2 mb-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
                        {t("Optics")} ({filteredOptics?.length})
                    </h3>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row">
                    <label htmlFor="search" className="text-sm text-gray-500 dark:text-gray-400">
                        {t("Search by Phone or Name")}:
                    </label>
                    <input
                        id="search"
                        type="text"
                        placeholder={t("Enter phone number or optic name")}
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:focus:ring-indigo-600"
                    />
                </div>
            </div>

            {isMobile ? (
                <div className="space-y-4">
                    {loading && (
                        <div className="flex justify-center items-center">
                            <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                        </div>
                    )}
                    {!loading && filteredOptics.length === 0 && (
                        <div className="text-center text-gray-500 dark:text-gray-400">{t("No data available")}</div>
                    )}
                    {!loading &&
                        currentRows.map((optic) => (
                            <div key={optic.id} className="p-4 bg-white rounded-lg shadow-md dark:bg-gray-800">
                                <div className="flex justify-between">
                                    <p className="font-medium text-gray-800 dark:text-white/90">
                                        {optic.opticName}
                                    </p>
                                    <Badge size="sm" color={optic.verified ? "confirmed" : "canceled"}>
                                        {t(optic.verified ? "Active" : "Inactive")}
                                    </Badge>
                                </div>
                                <p className="text-md text-gray-700 dark:text-gray-400">
                                    {optic.firstName} {optic.lastName}
                                </p>
                                <p className="text-md text-gray-700 dark:text-gray-400">{optic.tel}</p>
                                <p className="text-md text-gray-700 dark:text-gray-400">
                                    {t("Created")}:{" "}
                                    {new Date(optic.createdAt).toLocaleDateString("fr-FR", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                    })}
                                </p>
                                <div className="mt-2 flex justify-between items-center">
                                    <div>
                                        {optic.verified ? (
                                            <button
                                                onClick={() => handleDeactivate(optic.id)}
                                                disabled={updatingStatus === optic.id}
                                                className={`inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                    updatingStatus === optic.id
                                                        ? "bg-transparent text-gray-500 cursor-not-allowed"
                                                        : "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
                                                }`}
                                            >
                                                {updatingStatus === optic.id ? (
                                                    <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    t("Deactivate")
                                                )}
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleActivate(optic.id)}
                                                disabled={updatingStatus === optic.id}
                                                className={`inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                    updatingStatus === optic.id
                                                        ? "bg-transparent text-gray-500 cursor-not-allowed"
                                                        : "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500"
                                                }`}
                                            >
                                                {updatingStatus === optic.id ? (
                                                    <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                                                ) : (
                                                    t("Activate")
                                                )}
                                            </button>
                                        )}
                                    </div>
                                </div>
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
                                    {t("Optic Name")}
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-bold text-md text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    {t("Owner Name")}
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
                                    {t("Status")}
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-bold text-md text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    {t("Auto-Validate")}
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-bold text-md text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    {t("Created At")}
                                </TableCell>
                                <TableCell
                                    isHeader
                                    className="py-3 font-bold text-md text-gray-500 text-start text-theme-xs dark:text-gray-400"
                                >
                                    {t("Actions")}
                                </TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {loading && (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-6 text-center">
                                        <div className="flex justify-center items-center">
                                            <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loading && filteredOptics.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={8} className="py-6 text-center text-gray-500 dark:text-gray-400">
                                        {t("No data available")}
                                    </TableCell>
                                </TableRow>
                            )}
                            {!loading &&
                                currentRows.map((optic) => (
                                    <TableRow key={optic.id}>
                                        <TableCell className="py-3">
                                            <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                                                {optic.opticName}
                                            </p>
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            {optic.firstName} {optic.lastName}
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            {optic.tel}
                                        </TableCell>

                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            <Badge size="sm" color={optic.verified ? "confirmed" : "canceled"}>
                                                {t(optic.verified ? "Active" : "Inactive")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            <Badge size="sm" color={optic.autoValidate ? "confirmed" : "canceled"}>
                                                {t(optic.autoValidate ? "Enabled" : "Disabled")}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            {new Date(optic.createdAt).toLocaleDateString("fr-FR", {
                                                year: "numeric",
                                                month: "numeric",
                                                day: "numeric",
                                            })}
                                        </TableCell>
                                        <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                                            {optic.verified ? (
                                                <button
                                                    onClick={() => handleDeactivate(optic.id)}
                                                    disabled={updatingStatus === optic.id}
                                                    className={`inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                        updatingStatus === optic.id
                                                            ? "bg-transparent text-gray-500 cursor-not-allowed"
                                                            : "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500"
                                                    }`}
                                                >
                                                    {updatingStatus === optic.id ? (
                                                        <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        t("Deactivate")
                                                    )}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleActivate(optic.id)}
                                                    disabled={updatingStatus === optic.id}
                                                    className={`inline-flex items-center justify-center gap-2 rounded-md border border-transparent px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                                        updatingStatus === optic.id
                                                            ? "bg-transparent text-gray-500 cursor-not-allowed"
                                                            : "bg-green-500 text-white hover:bg-green-600 focus:ring-green-500"
                                                    }`}
                                                >
                                                    {updatingStatus === optic.id ? (
                                                        <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin" />
                                                    ) : (
                                                        t("Activate")
                                                    )}
                                                </button>
                                            )}
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
    );
}
