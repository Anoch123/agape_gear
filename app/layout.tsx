import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agape Gear - Premium Clothing",
  description: "Discover premium quality clothing at Agape Gear. Shop t-shirts, hoodies, jackets, pants and accessories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Navbar />
        <main className="pt-14 md:pt-0 min-h-screen">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
