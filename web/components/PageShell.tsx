import Link from "next/link";
import React from "react";

type PageShellProps = {
  title: string;
  description?: string;
  actions?: { label: string; href: string }[];
  children?: React.ReactNode;
};

export function PageShell({ title, description, actions, children }: PageShellProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12 space-y-6 relative">
      <div className="absolute -top-10 left-0 w-64 h-64 bg-[#8B5CFF]/15 blur-3xl pointer-events-none" />
      <div className="space-y-2 relative">
        <h1 className="text-3xl font-bold text-white">{title}</h1>
        {description && <p className="text-gray-300">{description}</p>}
        {actions && actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {actions.map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8B5CFF] to-[#24c0f7] text-white text-sm font-semibold shadow-[0_15px_35px_rgba(0,0,0,0.35)]"
              >
                {a.label}
              </Link>
            ))}
          </div>
        )}
      </div>
      <div className="space-y-4 relative">{children}</div>
    </div>
  );
}
