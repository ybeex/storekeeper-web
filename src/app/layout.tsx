import type { Metadata, Viewport } from "next";
import { Oswald, Public_Sans } from "next/font/google";
import { Providers } from "@/components/providers";
import { SwRegister } from "@/components/pwa";
import "./globals.css";

const display = Oswald({ subsets: ["latin"], weight: ["700", "600"], variable: "--font-display", display: "swap" });
const sans = Public_Sans({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "StoreKeeper", template: "%s | StoreKeeper" },
  description: "Know what your store has, who has it, and what went missing.",
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
  appleWebApp: { capable: true, title: "StoreKeeper", statusBarStyle: "default" },
};
export const viewport: Viewport = { viewportFit: "cover", themeColor: [{ media: "(prefers-color-scheme: light)", color: "#E4E8EA" }, { media: "(prefers-color-scheme: dark)", color: "#0F1517" }] };

// Runs before paint so the saved theme never flashes.
const themeScript = `try{var t=localStorage.getItem("sk-theme");if(!t)t=matchMedia("(prefers-color-scheme: dark)").matches?"night":"galvanized";document.documentElement.dataset.theme=t}catch(e){document.documentElement.dataset.theme="galvanized"}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="galvanized" className={`${display.variable} ${sans.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
        <SwRegister />
      </body>
    </html>
  );
}
