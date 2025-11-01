import type { Metadata } from "next";
import React from "react";
import RecentOrders from "@/components/ecommerce/RecentOrders";
import BackToMenu from "@/components/common/BackToMenu";


export default function Ecommerce() {
    return (
        <div className="gap-4 flex flex-col">
            <BackToMenu />
            <div className="col-span-12 space-y-10 xl:col-span-5">
                <RecentOrders />
            </div>
        </div>
    );
}
