"use client";
import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { AdminApi } from "@/app/api/AdminApi";
import {
  BoxCubeIcon,
  EyeIcon,
  ChatIcon,
  PageIcon,
  PieChartIcon,
  PlugInIcon,
  GridIcon,
  PaperPlaneIcon,
} from "../icons/index";

type MenuItem = {
  name: string;
  icon: React.ReactNode;
  path: string;
  logo?: string; // Path to logo image
  description?: string;
  color?: string; // Background color for the card
  backgroundIcon?: React.ReactNode; // Custom background icon for each item
};

const allMenuItems: MenuItem[] = [
  {
    name: "Extern Orders",
    icon: <PaperPlaneIcon />,
    path: "/external-order",
    logo: "/images/logo/dhlPlane.png",
    description: "External order management",
    color: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20",
    backgroundIcon: (
      <div className="text-9xl text-green-200 dark:text-green-800/30">
        <Image
          src="/images/logo/dhlPlane.png"
          alt="DHL Plane"
          width={120}
          height={120}
          className="opacity-40"
        />
      </div>
    )
  },
  {
    name: "Elemana Orders",
    icon: <BoxCubeIcon />,
    path: "/elemana-orders",
    logo: "/images/logo/browser_logo.png",
    description: "Elemana order management",
    color: "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
    backgroundIcon: <BoxCubeIcon />
  },
  {
    name: "CNNAM Orders",
    icon: <EyeIcon />,
    path: "/cnnam-orders",
    logo: "/images/logo/logocnam.png",
    description: "CNNAM order management",
    color: "bg-gradient-to-br from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20",
    backgroundIcon: <EyeIcon />
  },
  {
    name: "Optics",
    icon: <EyeIcon />,
    path: "/optic",
    logo: "/images/logo/optics.jpeg",
    description: "Optical products",
    color: "bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20",
    backgroundIcon: <EyeIcon />
  }
];

const BoxMenu: React.FC = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const [connectedUser, setConnectedUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await AdminApi.findMe();
        const user = response.data;
        setConnectedUser(user);
        console.log(user);
      } catch (error) {
        console.error("Failed to fetch user:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Filter menu items based on user condition
  const getMenuItems = (): MenuItem[] => {
    if (!connectedUser) return [];
    console.log("Connected user:", connectedUser);
    console.log("User username:", connectedUser.username);

    if (connectedUser.username === "44630222") {
      console.log("Showing all menu items for user 36469820");
      return allMenuItems;
    } else {
      console.log("Filtering menu items for regular user");
      return allMenuItems.filter(item =>
        item.name === "Extern Orders" || item.name === "Elemana Orders"
      );
    }
  };

  const menuItems = getMenuItems();

  const isActive = (path: string) => path === pathname;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400">Loading menu...</div>
        </div>
      </div>
    );
  }

  if (!connectedUser) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-600 dark:text-gray-400">No user data available</div>
        </div>
      </div>
    );
  }

  return (
    <div >
      <div className="max-w-7xl mx-auto">

        {/* Menu Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {menuItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={`group relative overflow-hidden rounded-3xl border transition-all duration-500 hover:shadow-2xl hover:scale-105 transform-gpu ${
                isActive(item.path)
                  ? "border-blue-400 shadow-2xl scale-105 ring-4 ring-blue-500/20"
                  : "border-gray-200/60 dark:border-gray-700/60 hover:border-blue-300/50 dark:hover:border-blue-600/50"
              } ${item.color} backdrop-blur-sm`}
            >
              {/* Enhanced Background Icon with Opacity */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] group-hover:opacity-[0.05] transition-all duration-500 group-hover:scale-110">
                {item.backgroundIcon && (
                  <div className="text-8xl transform rotate-12 group-hover:rotate-6 transition-transform duration-700">
                    {item.backgroundIcon}
                  </div>
                )}
              </div>

              {/* Animated Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/20 dark:from-black/0 dark:via-black/0 dark:to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

              <div className="relative p-8 z-10 h-full flex flex-col">
                {/* Logo/Icon Section */}
                <div className="flex items-center justify-center mb-6 flex-1">
                  <div className={`relative w-20 h-20 rounded-2xl flex items-center justify-center transform transition-all duration-500 group-hover:scale-110 ${
                    isActive(item.path)
                      ? "bg-white/80 dark:bg-gray-800/80 shadow-xl ring-2 ring-blue-500/30"
                      : "bg-white/60 dark:bg-gray-800/60 shadow-lg group-hover:shadow-xl group-hover:ring-2 group-hover:ring-blue-400/20"
                  } backdrop-blur-sm`}>
                    {item.logo ? (
                      <div className="relative w-13 h-13">
                        <Image
                          src={item.logo}
                          alt={item.name}
                          fill
                          className="object-contain transition-transform duration-500 group-hover:scale-110"
                          sizes="100px"
                        />
                      </div>
                    ) : (
                      <div className={`text-3xl transition-all duration-500 ${
                        isActive(item.path)
                          ? "text-blue-600 dark:text-blue-400"
                          : "text-gray-600 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400"
                      }`}>
                        {item.icon}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="text-center flex flex-col items-center">
                  <h3 className={`text-xl font-bold mb-3 transition-colors duration-300 ${
                    isActive(item.path)
                      ? "text-blue-900 dark:text-blue-100"
                      : "text-gray-900 dark:text-white group-hover:text-gray-800 dark:group-hover:text-gray-100"
                  }`}>
                    {t(item.name)}
                  </h3>
                  {item.description && (
                    <p className={`text-sm leading-relaxed transition-colors duration-300 ${
                      isActive(item.path)
                        ? "text-blue-700/90 dark:text-blue-300/90"
                        : "text-gray-600/80 dark:text-gray-400/80 group-hover:text-gray-700 dark:group-hover:text-gray-300"
                    }`}>
                      {t(item.description)}
                    </p>
                  )}
                </div>

                {/* Active Indicator */}
                {isActive(item.path) && (
                  <div className="absolute top-4 right-4">
                    <div className="relative">
                      <div className="w-4 h-4 bg-blue-500 rounded-full animate-ping absolute"></div>
                      <div className="w-4 h-4 bg-blue-600 rounded-full relative"></div>
                    </div>
                  </div>
                )}

                {/* Hover Arrow Indicator */}
                <div className={`absolute bottom-4 right-4 transform transition-all duration-300 ${
                  isActive(item.path) 
                    ? "translate-x-0 opacity-100" 
                    : "translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                }`}>
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Enhanced Hover Effect Overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

              {/* Glow Effect */}
              <div className={`absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
                isActive(item.path) 
                  ? "bg-blue-500/5" 
                  : "bg-blue-400/5"
              }`}></div>
            </Link>
          ))}
        </div>


      </div>
    </div>
  );
};

export default BoxMenu;
