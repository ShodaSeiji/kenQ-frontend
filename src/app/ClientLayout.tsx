"use client";

import { FormProvider } from "@/context/FormContext";
import Header from "@/components/Header";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

export default function ClientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const showHeader = !pathname.includes("/login");

  return (
    <SessionProvider>
      <FormProvider>
        {showHeader && <Header />}
        <main className="p-4">{children}</main>
      </FormProvider>
    </SessionProvider>
  );
}
