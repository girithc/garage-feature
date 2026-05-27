import type { Metadata } from "next";
import Link from "next/link";
import { Barlow_Condensed, Manrope } from "next/font/google";

import { HeaderNav } from "@/components/layout/HeaderNav";
import { NAV_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";

import "./globals.css";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope"
});

const barlowCondensed = Barlow_Condensed({
  subsets: ["latin"],
  variable: "--font-barlow-condensed",
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "AI Photo Intake for Municipal Equipment Listings",
  description:
    "Garage demo showing AI photo categorization, captioning, labeling, gallery grouping, corrections, and visual search."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(manrope.variable, barlowCondensed.variable, "font-sans")}>
        <div className="min-h-screen">
          <header className="sticky top-0 z-30 border-b border-ink/8 bg-ivory/85 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
              <Link href="/" className="flex items-center gap-3">
                <div>
                  <div className="font-display text-2xl uppercase leading-none tracking-[0.08em] text-ink">
                    Garage
                  </div>
                  <div className="text-xs uppercase tracking-[0.18em] text-steel">
                    AI Photo Intake Demo
                  </div>
                </div>
              </Link>
              <HeaderNav links={NAV_LINKS} />
            </div>
          </header>
          <main className="mx-auto max-w-7xl px-6 py-8 lg:px-10 lg:py-10">{children}</main>
        </div>
      </body>
    </html>
  );
}
