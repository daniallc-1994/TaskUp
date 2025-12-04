import React from "react";
import clsx from "clsx";

type CardProps = React.HTMLAttributes<HTMLDivElement>;

export const Card: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={clsx(
        "glass rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-lg shadow-purple-500/10",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
