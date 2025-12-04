import React from "react";
import clsx from "clsx";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "solid" | "outline" | "ghost";
  size?: "md" | "lg" | "sm";
  asChild?: boolean;
};

export const Button: React.FC<ButtonProps> = ({
  children,
  className,
  variant = "solid",
  size = "md",
  asChild = false,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0b0c15]";
  const variants = {
    solid: "bg-gradient-to-r from-[#8B5CFF] to-[#24c0f7] text-white shadow-[0_10px_40px_rgba(139,92,255,0.35)] hover:brightness-110",
    outline: "border border-white/20 text-white bg-white/5 hover:border-white/40 hover:bg-white/10 backdrop-blur",
    ghost: "text-white hover:bg-white/5",
  };
  const sizes = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-2",
    lg: "px-5 py-3 text-lg",
  };

  const classes = clsx(base, variants[variant], sizes[size], className);

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      className: clsx(classes, (children as any).props?.className),
    } as any);
  }

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  );
};
