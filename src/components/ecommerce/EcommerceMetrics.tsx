"use client";
import React, { useEffect, useState } from "react";
import { GroupIcon } from "@/icons";
import { OrderApi } from "@/app/api/orderApi";

export const EcommerceMetrics = () => {
    const [orderCounts, setOrderCounts] = useState<
        { status: string; count: number }[]
    >([]);

    useEffect(() => {
        const fetchOrderCounts = async () => {
            try {
                const response = await OrderApi.getCountOrders();
                const apiData = response.data;

                const allStatuses = ["PENDING", "CONFIRMED", "CONSTRUCTED", "DELIVERED"];

                const countMap = new Map(apiData.map((item: { status: string; count: number }) => [item.status, item.count]));

                const mergedData = allStatuses.map((status) => ({
                    status,
                    count: countMap.get(status) || 0,
                }));

                setOrderCounts(mergedData);
            } catch (error) {
                console.error("Error fetching order counts:", error);
            }
        };

        fetchOrderCounts();
    }, []);

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 md:gap-6">
            {orderCounts.map(({ status, count }) => (
                <div
                    key={status}
                    className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
                >
                    <div
                        className={`flex items-center justify-center w-12 h-12 rounded-xl ${
                            status === "PENDING"
                                ? "bg-yellow-100 dark:bg-yellow-800"
                                : status === "CONFIRMED"
                                    ? "bg-green-100 dark:bg-green-800"
                                    : status === "CONSTRICTED"
                                        ? "bg-red-100 dark:bg-red-800"
                                        : "bg-blue-100 dark:bg-blue-800"
                        }`}
                    >
                        <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
                    </div>

                    <div className="flex items-end justify-between mt-5">
                        <div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {getStatusLabel(status)}
              </span>
                            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                                {count}
                            </h4>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

const getStatusLabel = (status: string): string => {
    switch (status) {
        case "PENDING":
            return "Customers En Attente";
        case "CONFIRMED":
            return "Customers Confirmed";
        case "CONSTRICTED":
            return "Customers Restricted";
        case "DELIVERED":
            return "Customers Delivered";
        default:
            return status;
    }
};
