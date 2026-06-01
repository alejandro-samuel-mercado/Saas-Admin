import { FloatingNav } from "@/components/layout/floating-nav";
import QueryProvider from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Suspense } from "react";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Admin Panel",
  description: "Sistema de Venta y Gestión",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen bg-background text-foreground`}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <QueryProvider>
              {children}
              <Suspense fallback={null}>
                <FloatingNav />          
              </Suspense>  
               <Toaster richColors position="bottom-right" closeButton toastOptions={{ className: "border-4 border-borderH/80" }} />
            </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
