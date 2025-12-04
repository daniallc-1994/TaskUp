import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { MainShell } from "../src/components/layout/MainShell";

export const metadata: Metadata = {
  title: "TaskUp – Nordic marketplace",
  description: "Secure escrow, live offers, and realtime chat for clients and taskers.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>
          <MainShell>{children}</MainShell>
        </Providers>
      </body>
    </html>
  );
}
