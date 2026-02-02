import type { Metadata } from "next";

import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { inter } from "@/fonts";

export const metadata: Metadata = {
  title: "Taiga AI Assistant",
  description:
    "Asistente inteligente para gestionar proyectos en Taiga usando lenguaje natural",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark">
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
