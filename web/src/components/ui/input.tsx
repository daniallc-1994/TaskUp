import React from "react";
import clsx from "clsx";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={clsx(
        "w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2 text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B5CFF]/60 shadow-[0_10px_30px_rgba(0,0,0,0.35)] backdrop-blur",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = "Input";
