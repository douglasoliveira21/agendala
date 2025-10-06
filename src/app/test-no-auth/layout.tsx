import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Teste Sem Auth - AgendaFácil",
  description: "Página de teste sem autenticação",
};

export default function TestNoAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <main className="pt-16">
          {children}
        </main>
      </body>
    </html>
  );
}