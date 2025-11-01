"use client";

import { Outfit } from "next/font/google";
import "./globals.css";
import "../../i18n";
import { ThemeProvider } from "@/context/ThemeContext";
import { useEffect, useState } from "react";
import apiClient from "@/lib/ApiClient";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";

const outfit = Outfit({
    subsets: ["latin"],
});

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const { i18n } = useTranslation();

    useEffect(() => {
        document.title = "El Emana Optique";
    }, []);

    useEffect(() => {
        const checkAuthStatus = () => {
            const loggedIn =
                !!localStorage.getItem("isLoggedIn") &&
                !!localStorage.getItem("access_token");
            setIsLoggedIn(loggedIn);

            if (!loggedIn && !window.location.pathname.includes("/signin")) {
                router.push("/signin");
            }
            else if (loggedIn && window.location.pathname.includes("/signin")) {
                router.push("/");
            }

            setIsLoading(false);
        };
        checkAuthStatus();
    }, [router]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            apiClient.setOnUnauthorizedCallback(() => {
                localStorage.removeItem("isLoggedIn");
                localStorage.removeItem("access_token");
                router.push("/signin");
            });

            const handleBackButton = (event: PopStateEvent) => {
                if (isLoggedIn) {
                    if (window.location.pathname.includes("/signin")) {
                        window.history.go(1);
                    }
                }
            };

            window.history.pushState(null, "", window.location.pathname);
            window.addEventListener("popstate", handleBackButton);

            return () => {
                window.removeEventListener("popstate", handleBackButton);
            };
        }
    }, [router, isLoggedIn]);

    const getDirection = () => {
        const currentLanguage = i18n.language;
        return ["ar"].includes(currentLanguage) ? "rtl" : "ltr";
    };

    if (isLoading) {
        return (
            <html lang={i18n.language} dir={getDirection()}>
            <body className={`${outfit.className} dark:bg-gray-900`}>
            <div className="flex items-center justify-center h-screen bg-gray-100 dark:bg-gray-900">
                <div
                    className="w-16 h-16 border-4 border-t-4 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin"
                ></div>
            </div>
            </body>
            </html>
        );
    }

    return (
        <html lang={i18n.language} dir={getDirection()}>
        <body className={`${outfit.className} dark:bg-gray-900`}>
        <ThemeProvider>
            {children}
        </ThemeProvider>
        </body>
        </html>
    );
}
