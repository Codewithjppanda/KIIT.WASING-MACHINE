import React from "react";
import { motion, HTMLMotionProps } from "motion/react";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
  className?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", children, className = "", ...props }, ref) => {
    const baseStyles = "rounded-lg font-medium transition-all duration-300 flex items-center justify-center";
    
    const variants = {
      primary: "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:opacity-90 hover:shadow-xl",
      secondary: "bg-white text-black border border-gray-300 hover:bg-gray-100 dark:bg-black dark:text-white dark:border-gray-700 dark:hover:bg-gray-900",
      outline: "border-2 border-blue-500 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950",
    };

    const sizes = {
      sm: "px-4 py-1.5 text-sm",
      md: "px-6 py-2 text-base",
      lg: "px-8 py-3 text-lg",
    };
  return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
      >
        {children}
      </motion.button>
    );
}
);

Button.displayName = "Button";

export default Button;
