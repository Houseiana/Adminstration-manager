import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter, Cairo } from "next/font/google";
import { Providers } from "@/components/Providers";
import { ToastProvider } from "@/components/Toast";
import { Shell } from "@/components/Shell";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Admin Manager Dashboard",
  description: "Bilingual HR & Payroll admin dashboard",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#facc15",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className={`${inter.variable} ${cairo.variable}`}>
      <body>
        <Providers>
          <ToastProvider>
            <Shell>{children}</Shell>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
