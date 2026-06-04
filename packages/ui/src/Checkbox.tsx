import React from "react";
import { clsx } from "./utils";

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, ...props }, ref) => (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <input
        ref={ref}
        type="checkbox"
        className={clsx(
          "h-4 w-4 rounded border-gray-300 text-[#4CAF82] accent-[#4CAF82] cursor-pointer",
          className,
        )}
        {...props}
      />
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </label>
  ),
);
Checkbox.displayName = "Checkbox";
