
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/ui/Footer";
import { GlobalChat } from "@/features/chat/GlobalChat";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Property Dosti",
  description: "Connect with verified brokers in Karnataka",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Navbar />
        <main className="min-h-[calc(100vh-200px)]">
          {children}
        </main>
        <Footer />
        <GlobalChat />
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
