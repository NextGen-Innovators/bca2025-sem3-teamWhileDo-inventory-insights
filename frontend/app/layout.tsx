// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import SessionProviderClient from "@/lib/providers/SessionProviderClient";
import QueryProviders from "@/lib/providers/queryProviders";
import { Toaster } from "@/components/ui/sonner";
import { AppSidebar } from "@/components/sidebar";
import { DashboardProvider } from "@/components/context/dashboard-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HR Portal",
  description: "Employee management system",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProviderClient>
          <QueryProviders>
    <DashboardProvider>


            <div className="flex min-h-screen bg-gray-50">
              <AppSidebar />
              <main className="flex-1 md:ml-0 overflow-x-hidden">
                {children}
              </main>
            </div>
    </DashboardProvider>
            <Toaster />
          </QueryProviders>
        </SessionProviderClient>
      </body>
    </html>
  );
}