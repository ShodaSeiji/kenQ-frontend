"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const userId = localStorage.getItem("company_user_id");
    router.replace(userId ? "/register" : "/login");
  }, [router]);

  return null;
}

