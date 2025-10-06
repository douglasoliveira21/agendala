import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProviderWrapper } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/toaster";
import { Header } from "@/components/ui/header";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Agendalá - Plataforma de Agendamentos",
  description: "A plataforma mais moderna e intuitiva para agendamento de serviços. Conecte-se com os melhores profissionais da sua região.",
  keywords: "agendamento, serviços, profissionais, agenda, booking, agendalá",
  authors: [{ name: "Agendalá" }],
  openGraph: {
    title: "Agendalá - Plataforma de Agendamentos",
    description: "A plataforma mais moderna e intuitiva para agendamento de serviços. Conecte-se com os melhores profissionais da sua região.",
    type: "website",
    locale: "pt_BR",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport = "width=device-width, initial-scale=1";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        <SessionProviderWrapper>
          <Header />
          <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
            {children}
          </main>
          <Toaster />
        </SessionProviderWrapper>
      </body>
    </html>
  );
}
