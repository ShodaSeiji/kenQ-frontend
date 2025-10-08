# kenQ Frontend Deployment Guide

## Azure App Service へのデプロイ設定

このリポジトリは GitHub Actions を使用して Azure App Service に自動デプロイされます。

### 現在の設定

- **App Name**: app-kenq-aco-2
- **デプロイブランチ**: master
- **Node.js バージョン**: 20.x

### GitHub Secrets の確認

以下のシークレットが設定されていることを確認してください：

- `AZUREAPPSERVICE_PUBLISHPROFILE_C93B494C1D604DF58A1906DA560A3582`
  - Azure App Service の Publish Profile

### Publish Profile の更新方法

1. **Azure Portal での操作**
   - Azure Portal にログイン
   - App Service "app-kenq-aco-2" を選択
   - デプロイメント > デプロイセンター
   - 「プロファイルのダウンロード」をクリック

2. **GitHub での操作**
   - GitHub リポジトリ > Settings > Secrets and variables > Actions
   - `AZUREAPPSERVICE_PUBLISHPROFILE_C93B494C1D604DF58A1906DA560A3582` を更新
   - ダウンロードした `.PublishSettings` ファイルの内容をペースト

### 環境変数の設定

Azure Portal > App Service > 設定 > 構成 で以下を設定：

- `NEXTAUTH_URL`: アプリケーションのURL（例: https://app-kenq-aco-2.azurewebsites.net）
- `NEXTAUTH_SECRET`: 認証用のシークレット（ランダムな文字列）
- `NEXT_PUBLIC_API_URL`: バックエンドAPIのURL

### デプロイフロー

1. `master` ブランチに push すると自動的にデプロイが開始されます
2. GitHub Actions が以下を実行：
   - Node.js 20.x のセットアップ
   - 依存関係のインストール (`npm install`)
   - ビルド (`npm run build`)
   - Next.js スタンドアロンモードでのデプロイ
   - Azure App Service へのデプロイ

### Next.js の設定

`next.config.mjs` に以下の設定が必要です：

```javascript
const nextConfig = {
  output: 'standalone',
  // その他の設定...
};
```

### 手動デプロイ

GitHub リポジトリの Actions タブから「Build and deploy Node.js app to Azure Web App - app-kenq-aco-2」ワークフローを選択し、「Run workflow」をクリックすることで手動デプロイも可能です。

### トラブルシューティング

#### デプロイが失敗する場合

1. **GitHub Actions のログを確認**
   - Actions タブで失敗したワークフローを確認
   - ビルドエラーやデプロイエラーの詳細を確認

2. **Azure App Service のログを確認**
   - Azure Portal > App Service > 監視 > ログストリーム
   - アプリケーションのランタイムエラーを確認

3. **よくある問題**
   - Publish Profile の有効期限切れ → 再ダウンロードして更新
   - ビルドエラー → ローカルで `npm run build` が成功することを確認
   - 環境変数の設定漏れ → Azure Portal で必要な環境変数が設定されているか確認

### ローカルでのテスト

デプロイ前にローカルでビルドをテストすることを推奨します：

```bash
npm install
npm run build
npm start
```
