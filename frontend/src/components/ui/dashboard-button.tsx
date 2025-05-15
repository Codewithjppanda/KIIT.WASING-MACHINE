"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface DashboardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "primary" | "secondary";
}

export const DashboardButton = ({
  children,
  className,
  variant = "primary",
  ...props
}: DashboardButtonProps) => {
  const baseStyles = "w-full transform rounded-full font-medium transition-all duration-300 hover:-translate-y-0.5 px-6 py-2";
  
  const variants = {
    primary: "bg-black text-white hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200",
    secondary: "border border-gray-300 bg-white text-black hover:bg-gray-100 dark:border-gray-700 dark:bg-black dark:text-white dark:hover:bg-gray-900"
  };

  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}; 