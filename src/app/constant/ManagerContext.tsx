"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = 'JFb5K2Q0W6yPzRbNQrYpHbJ9RncgBnV8c1NxajY5Fsk=';

type Manager = {
    id: number;
    username: string;
    email: string;
    [key: string]: any;
};

type ManagerContextType = {
    manager: Manager | null;
    setManager: (manager: Manager) => void;
};

const ManagerContext = createContext<ManagerContextType | undefined>(undefined);

export const ManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [manager, setManager] = useState<Manager | null>(null);

    useEffect(() => {
        const encryptedManager = localStorage.getItem("manager");
        if (encryptedManager) {
            try {
                const decryptedData = CryptoJS.AES.decrypt(encryptedManager, ENCRYPTION_KEY).toString(CryptoJS.enc.Utf8);
                setManager(JSON.parse(decryptedData));
            } catch (error) {
                console.error("Failed to decrypt manager data:", error);
                localStorage.removeItem("manager");
            }
        }
    }, []);

    useEffect(() => {
        if (manager) {
            const encryptedManager = CryptoJS.AES.encrypt(JSON.stringify(manager), ENCRYPTION_KEY).toString();
            localStorage.setItem("manager", encryptedManager);
        } else {
            localStorage.removeItem("manager");
        }
    }, [manager]);

    return (
        <ManagerContext.Provider value={{ manager, setManager }}>
            {children}
        </ManagerContext.Provider>
    );
};

export const useManager = () => {
    const context = useContext(ManagerContext);
    if (context === undefined) {
        throw new Error("useManager must be used within a ManagerProvider");
    }
    return context;
};
