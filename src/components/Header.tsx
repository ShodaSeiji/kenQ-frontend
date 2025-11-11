"use client";

import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useFormContext } from "@/context/FormContext";
import { useTranslations } from 'next-intl';
import LanguageSwitcher from "./LanguageSwitcher";

const Header = () => {
  const t = useTranslations('header');
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showNavigateConfirm, setShowNavigateConfirm] = useState(false);
  const [showRegisterReloadConfirm, setShowRegisterReloadConfirm] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();
  const { resetForm } = useFormContext();

  const userName = session?.user?.name || "ユーザー";

  const handleLogout = async () => {
    // NextAuthのログアウト処理
    await signOut({ callbackUrl: "/login" });
  };

  const handleReloadMyPage = () => {
    // 現在のページがマイページの場合はリロード
    if (window.location.pathname === '/mypage') {
      window.location.reload();
    }
    // 新規登録画面の場合は確認モーダルを表示
    else if (window.location.pathname === '/register') {
      setShowNavigateConfirm(true);
    }
    // その他の場合はマイページに直接遷移
    else {
      router.push('/mypage');
    }
  };

  const handleConfirmNavigate = () => {
    setShowNavigateConfirm(false);
    resetForm();
    router.push('/mypage');
  };

  const handleRegisterClick = () => {
    // 現在のページが新規登録画面の場合は確認モーダルを表示
    if (window.location.pathname === '/register') {
      setShowRegisterReloadConfirm(true);
    } else {
      // その他の場合は新規登録画面に遷移
      resetForm();
      router.push('/register');
    }
  };

  const handleConfirmRegisterReload = () => {
    setShowRegisterReloadConfirm(false);
    resetForm();
  };


  return (
    <>
    <header className="flex items-center justify-between p-4 shadow-md bg-white">
      {/* 研Qロゴ */}
      <div className="text-xl font-bold">
        <img src="/研Qロゴ.png" alt="研Qのロゴ" className="h-10" />
      </div>

      {/* 中央エリア（スペース確保用） */}
      <div className="flex-1"></div>

      {/* 右側のユーザーエリア */}
      <div className="flex items-center gap-6">
        {/* 言語切り替え */}
        <LanguageSwitcher />

        {/* リサーチ案件一覧ボタン */}
        <button
          onClick={handleReloadMyPage}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
          >
            <path
              d="M3 9L12 2L21 9V20C21 20.5304 20.7893 21.0391 20.4142 21.4142C20.0391 21.7893 19.5304 22 19 22H5C4.46957 22 3.96086 21.7893 3.58579 21.4142C3.21071 21.0391 3 20.5304 3 20V9Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M9 22V12H15V22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t('projectList')}
        </button>

        {/* 新規登録ボタン */}
        <button
          onClick={handleRegisterClick}
          className="flex items-center gap-2 text-gray-700 hover:text-gray-900 transition"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5"
          >
            <path
              d="M12 20H21"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M16.5 3.5C16.8978 3.10217 17.4374 2.87868 18 2.87868C18.2786 2.87868 18.5544 2.93355 18.8118 3.04014C19.0692 3.14674 19.303 3.303 19.5 3.5C19.697 3.697 19.8533 3.93085 19.9599 4.18823C20.0665 4.44561 20.1213 4.72141 20.1213 5C20.1213 5.27859 20.0665 5.55439 19.9599 5.81177C19.8533 6.06915 19.697 6.303 19.5 6.5L7 19L3 20L4 16L16.5 3.5Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {t('newRegistration')}
        </button>

        {/* ユーザー名 */}
        <span className="text-gray-700">{userName}</span>

        {/* ログアウトアイコン */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="text-gray-700 hover:text-gray-900 transition"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
          >
            <path
              d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </header>


    {/* ログアウト確認ポップアップ */}
    {showLogoutConfirm && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm w-full mx-4">
          <h2 className="text-lg font-semibold mb-4">{t('logoutConfirmTitle')}</h2>
          <p className="text-gray-600 mb-6">{t('logoutConfirmMessage')}</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-gray-700 text-white rounded hover:bg-gray-800 transition"
            >
              {t('yes')}
            </button>
            <button
              onClick={() => setShowLogoutConfirm(false)}
              className="px-6 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition"
            >
              {t('no')}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* 新規登録からの遷移確認ポップアップ */}
    {showNavigateConfirm && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm w-full mx-4">
          <h2 className="text-lg font-semibold mb-4">{t('navigateConfirmTitle')}</h2>
          <p className="text-gray-600 mb-2">{t('navigateConfirmMessage')}</p>
          <p className="text-gray-600 mb-6">{t('navigateWarning')}</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleConfirmNavigate}
              className="px-6 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition font-medium"
            >
              {t('yes')}
            </button>
            <button
              onClick={() => setShowNavigateConfirm(false)}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              {t('no')}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* 新規登録画面リロード確認ポップアップ */}
    {showRegisterReloadConfirm && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg text-center max-w-sm w-full mx-4">
          <h2 className="text-lg font-semibold mb-4">{t('registerReloadConfirmTitle')}</h2>
          <p className="text-gray-600 mb-2">{t('registerReloadConfirmMessage')}</p>
          <p className="text-gray-600 mb-6">{t('registerReloadWarning')}</p>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleConfirmRegisterReload}
              className="px-6 py-2 bg-blue-400 text-white rounded-lg hover:bg-blue-500 transition font-medium"
            >
              {t('yes')}
            </button>
            <button
              onClick={() => setShowRegisterReloadConfirm(false)}
              className="px-6 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              {t('no')}
            </button>
          </div>
        </div>
      </div>
    )}
  </>
  );
};

export default Header;

