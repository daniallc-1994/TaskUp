import React from "react";
import clsx from "clsx";

type BadgeProps = React.HTMLAttributes<HTMLDivElement>;

export const Badge: React.FC<BadgeProps> = ({ className, children, ...props }) => (
  <div
    className={clsx(
      "inline-flex items-center rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white",
      className
    )}
    {...props}
  >
    {children}
  </div>
);
