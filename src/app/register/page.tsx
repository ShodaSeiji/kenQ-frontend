"use client";

import { useState } from "react";
import RequestForm from "@/components/RequestForm";
import { useFormContext } from "@/context/FormContext";

export default function RegisterPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const { resetKey } = useFormContext();

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg mt-10">
      {!isProcessing && (
        <h1 className="text-3xl font-bold mb-4">依頼案件の登録</h1>
      )}
      <RequestForm key={resetKey} onStatusChange={setIsProcessing} />
    </div>
  );
}
