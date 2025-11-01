"use client";
import Link from "next/link";
import { ChevronLeftIcon } from "@/icons/index";
import {useTranslation} from "react-i18next";


const BackToMenu: React.FC = () => {

  const {t,i18n } = useTranslation();

  return (
    <div className="mb-6">
      <Link
        href="/"
        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
      >
        <ChevronLeftIcon className="w-4 h-4 mr-2" />
        {t('Back to Menu')}
      </Link>
    </div>
  );
};

export default BackToMenu;
