import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  experimental: {
  },
  async headers() {
    return [
      {
        source: "/(.*)", // 全てのルートに適用
        headers: [
          {
            key: "Content-Security-Policy", // コンテンツセキュリティポリシーを設定
            value: process.env.NODE_ENV === 'production'
              ? // 本番環境: 厳格なCSP
                `default-src 'self'; ` +
                `script-src 'self' 'unsafe-inline'; ` +
                `style-src 'self' 'unsafe-inline' fonts.googleapis.com; ` +
                `font-src 'self' fonts.gstatic.com; ` +
                `img-src 'self' data:; ` +
                `connect-src 'self' ${process.env.API_URL || ''} ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}; ` +
                `form-action 'self'; ` +
                `object-src 'none';`
              : // 開発環境: Next.js/HMRに必要な最小限の許可
                `default-src 'self'; ` +
                `script-src 'self' 'unsafe-inline' 'unsafe-eval'; ` +
                `style-src 'self' 'unsafe-inline' fonts.googleapis.com; ` +
                `font-src 'self' fonts.gstatic.com; ` +
                `img-src 'self' data:; ` +
                `connect-src 'self' ${process.env.API_URL || ''} ${process.env.NEXTAUTH_URL || 'http://localhost:3000'}; ` +
                `form-action 'self'; ` +
                `object-src 'none';`,
          },
          {
            key: "X-Frame-Options", // フレーム内での表示を制限
            value: "SAMEORIGIN",
          },
          {
            key: "X-XSS-Protection", // XSS攻撃を検知・ブロック
            value: "1; mode=block",
          },
          {
            key: "X-Content-Type-Options", // ブラウザが MIME タイプを勝手に判別するのを防ぐ (MIME スニッフィング防止)
            value: "nosniff",
          },
          {
            key: "Strict-Transport-Security", // HTTPSを強制
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Referrer-Policy", // リファラーポリシーを設定
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy", // 特定の機能の使用を制限
            value: "geolocation=(), camera=()",
          },
        ],
      },
    ];
  },
}

export default withNextIntl(nextConfig);
