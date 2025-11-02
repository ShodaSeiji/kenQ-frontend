import { withAuth } from "next-auth/middleware";

export default withAuth(
  () => {
    // 認証されていれば何もしない（pass-through）
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return !!token; // トークンがあればOK
      },
    },
    pages: {
      signIn: "/login", // ログインページへリダイレクト
    },
  }
);

// このミドルウェアを適用するルートパターン
export const config = {
  matcher: ["/projects/:path*", "/researcher/:path*", "/register/:path*"],
};