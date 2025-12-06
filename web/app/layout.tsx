import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { MainShell } from "../src/components/layout/MainShell";
import { CookieConsent } from "../src/components/CookieConsent";
import Script from "next/script";

export const metadata: Metadata = {
  title: "TaskUp | Nordic marketplace",
  description: "Secure escrow, live offers, and realtime chat for clients and taskers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        {process.env.NEXT_PUBLIC_GA_ID ? (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`} strategy="afterInteractive" />
            <Script id="ga-init" strategy="afterInteractive">
              {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
            `}
            </Script>
          </>
        ) : null}
        <Providers>
          <MainShell>
            {children}
            <CookieConsent />
          </MainShell>
        </Providers>
      </body>
    </html>
  );
}
