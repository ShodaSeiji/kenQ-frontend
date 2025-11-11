import "./globals.css";
import { ReactNode } from "react";
import { Noto_Sans_JP } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import ClientLayout from './ClientLayout';

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

type Props = {
  children: ReactNode;
};

export default async function RootLayout({ children }: Props) {
  // ロケールとメッセージの取得
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className="light">
      <body className={`${notoSansJP.className} antialiased bg-white text-black`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ClientLayout>{children}</ClientLayout>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

