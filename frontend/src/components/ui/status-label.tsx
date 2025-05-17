import React from "react";
import { cn } from "@/lib/utils";

interface StatusLabelProps {
  label: string;
  value: string | number;
  valueColor?: string;
  className?: string;
}

const StatusLabel = ({ label, value, valueColor = "text-white", className }: StatusLabelProps) => {
  return (
    <div className={cn(
      "bg-zinc-800/50 rounded-2xl px-4 py-2.5 flex flex-col gap-1",
      className
    )}>
      <span className="text-sm text-neutral-400">{label}</span>
      <span className={cn("font-medium", valueColor)}>{value}</span>
    </div>
  );
};

export { StatusLabel }; 