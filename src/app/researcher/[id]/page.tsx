"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ResearcherPage() {
    const router = useRouter();

    useEffect(() => {
        router.push('/register');
    }, [router]);

    return <p>Loading...</p>;
}