import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useTranslation } from 'next-i18next';


interface LanguageContextType {
    language: string;
    changeLanguage: (lang: string) => void;
}


const LanguageContext = createContext<LanguageContextType>({
    language: 'fr',
    changeLanguage: () => {},
});

interface LanguageProviderProps {
    children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
    const { i18n } = useTranslation();
    const [language, setLanguage] = useState('fr');

    useEffect(() => {
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    }, [language]);

    const changeLanguage = (lang: string) => {
        setLanguage(lang);
        if (i18n && typeof i18n.changeLanguage === 'function') {
            i18n.changeLanguage(lang);
        } else {
            console.error("i18n.changeLanguage is not available.");
        }
    };

    return (
        <LanguageContext.Provider value={{ language, changeLanguage }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
