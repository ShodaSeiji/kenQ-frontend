"use client";

import "./globals.css";
import { FormProvider } from "@/context/FormContext";
import Header from "@/components/Header";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { Noto_Sans_JP } from "next/font/google";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showHeader = !pathname.startsWith("/login");

  return (
    <html lang="ja" className="light">
      <body className={`${notoSansJP.className} antialiased bg-white text-black`}>
        <SessionProvider>
          <FormProvider>
            {showHeader && <Header />}
            <main className="p-4">{children}</main>
          </FormProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

