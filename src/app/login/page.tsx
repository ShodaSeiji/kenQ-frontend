"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import Image from "next/image";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const [companyUserName, setCompanyUserName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const searchParams = useSearchParams();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const callbackUrl = searchParams.get("callbackUrl") ?? "/mypage";

      const result = await signIn("credentials", {
        company_user_name: companyUserName,
        password,
        redirect: false, // 結果を確認するためredirectをfalseに
        callbackUrl,
      });

      if (result?.error) {
        if (result.error === "CredentialsSignin") {
          setError("UserIDかPasswordが間違っています");
        } else {
          setError("エラーが発生しました。もう一度お試しください。");
        }
      } else if (result?.ok) {
        // 認証成功時はリダイレクト
        router.push(callbackUrl);
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("エラーが発生しました。もう一度お試しください。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* ロゴ */}
        <div className="text-center mb-12">
          <Image
            src="/研Qロゴ.png"
            alt="研Q"
            width={120}
            height={60}
            className="mx-auto"
          />
        </div>

        {/* ログインフォーム */}
        <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* User ID */}
          <div>
            <input
              type="text"
              value={companyUserName}
              onChange={(e) => setCompanyUserName(e.target.value)}
              placeholder="User ID"
              className="w-full px-4 py-4 border border-gray-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent"
              autoComplete="username"
              name="company_user_name"
              id="company_user_name"
              required
            />
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-4 py-4 pr-12 border border-gray-200 rounded-lg bg-white text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent [&::-ms-reveal]:hidden [&::-ms-clear]:hidden"
              autoComplete="new-password"
              name="password"
              id="password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? (
                <EyeSlashIcon className="h-5 w-5" />
              ) : (
                <EyeIcon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Log In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-slate-600 text-white py-4 rounded-lg font-medium hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            {isLoading ? "ログイン中..." : "Log In"}
          </button>
        </form>

        {/* 説明文 */}
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            アカウント、パスワードを忘れた方は担当者に連絡してください。
          </p>
        </div>
      </div>
    </div>
  );
}
