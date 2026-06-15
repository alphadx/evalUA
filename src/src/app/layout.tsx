import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "EvalUA v3.0",
  description: "Sistema de Evaluación Curricular por Rúbricas",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <main>{children}</main>
      </body>
    </html>
  );
}
