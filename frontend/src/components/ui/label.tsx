// Label component extends from shadcnui - https://ui.shadcn.com/docs/components/label

"use client";
import React from "react";
import { motion, HTMLMotionProps } from "motion/react";

interface LabelProps extends Omit<HTMLMotionProps<"label">, "ref"> {
  variant?: "default" | "heading" | "subtitle";
  children: React.ReactNode;
  className?: string;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ variant = "default", children, className = "", ...props }, ref) => {
    const baseStyles = "block font-medium";
    
    const variants = {
      default: "text-gray-700 dark:text-gray-200",
      heading: "text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600",
      subtitle: "text-gray-500 dark:text-gray-400",
    };

    return (
      <motion.label
        ref={ref}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        {...props}
      >
        {children}
      </motion.label>
    );
  }
);

Label.displayName = "Label";

export default Label;
