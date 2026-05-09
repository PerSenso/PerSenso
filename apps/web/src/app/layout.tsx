import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { CartProvider } from "@/components/providers/CartProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { Toaster } from "sonner";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Persenso — Perfumes 100% Originales",
  description: "Fragancias exclusivas de diseñador, árabes y de nicho. Eleva tu presencia con aromas que dejan huella.",
  openGraph: {
    title: "Persenso — Perfumes 100% Originales",
    description: "Fragancias exclusivas de diseñador, árabes y de nicho.",
    locale: "es_VE",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning className={`${cormorant.variable} ${dmSans.variable}`}>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <CartProvider>
            {children}
            <Toaster position="bottom-right" richColors />
          </CartProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
