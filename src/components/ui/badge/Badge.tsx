import React from "react";

type BadgeVariant = "light" | "solid";
type BadgeSize = "sm" | "md";
type BadgeColor =
    | "primary"
    | "pending"
    | "confirmed"
    | "ready"
    | "delivered"
    | "canceled";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  color?: BadgeColor;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  children: React.ReactNode;
}

const Badge: React.FC<BadgeProps> = ({
                                       variant = "light",
                                       color = "primary",
                                       size = "md",
                                       startIcon,
                                       endIcon,
                                       children,
                                     }) => {
  const baseStyles =
      "inline-flex items-center px-2.5 py-0.5 justify-center gap-1 rounded-full font-medium";

  const sizeStyles = {
    sm: "text-xs",
    md: "text-sm",
  };

  // Updated color schemes to match status blocks
  const variants = {
    light: {
      primary: "bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400",
      pending: "bg-yellow-50 text-yellow-600 dark:bg-yellow-500/15 dark:text-yellow-400",
      confirmed: "bg-green-50 text-green-600 dark:bg-green-500/15 dark:text-green-400",
      ready: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400",
      delivered: "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-400",
      canceled: "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-400",
    },
    solid: {
      primary: "bg-brand-600 text-white dark:bg-brand-500",
      pending: "bg-yellow-500 text-white dark:bg-yellow-500",
      confirmed: "bg-green-500 text-white dark:bg-green-500",
      ready: "bg-blue-500 text-white dark:bg-blue-500",
      delivered: "bg-purple-500 text-white dark:bg-purple-500",
      canceled: "bg-red-500 text-white dark:bg-red-500",
    },
  };

  const sizeClass = sizeStyles[size];
  const colorStyles = variants[variant][color];

  return (
      <span className={`${baseStyles} ${sizeClass} ${colorStyles}`}>
      {startIcon && <span className="mr-1">{startIcon}</span>}
        {children}
        {endIcon && <span className="ml-1">{endIcon}</span>}
    </span>
  );
};

export default Badge;
