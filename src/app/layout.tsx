
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { GlobalChat } from "@/features/chat/GlobalChat";
import { cn } from "@/lib/utils";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Property Dosti",
  description: "Connect with verified brokers in Karnataka",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={cn(inter.className, "bg-grid-pattern")} suppressHydrationWarning>
        <Navbar />
        <main className="min-h-[calc(100vh-200px)] relative">
          {children}
        </main>
        <Footer />
        <GlobalChat />
        <InstallPrompt />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
