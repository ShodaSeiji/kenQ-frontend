# kenQ Frontend Deployment Guide

## Azure App Service へのデプロイ設定

このリポジトリは GitHub Actions を使用して Azure App Service に自動デプロイされます。

### デプロイ先情報

- **リソースグループ**: kenq-project-freePoC
- **App Service 名**: app-kenq-freepoc-4
- **デプロイ先URL**: https://app-kenq-freepoc-4-h9ahafbpb6aqa3d9.japaneast-01.azurewebsites.net
- **デプロイブランチ**: master
- **Node.js バージョン**: 20.x

### GitHub Secrets の設定

以下のシークレットが必要です：

1. **Publish Profile の取得**
   - Azure Portal > App Service "app-kenq-freepoc-4" > デプロイメント > デプロイセンター
   - 「プロファイルのダウンロード」をクリック
   - `.PublishSettings` ファイルをダウンロード

2. **GitHub Secrets への追加**
   - GitHub リポジトリ > Settings > Secrets and variables > Actions
   - 既存の `AZUREAPPSERVICE_PUBLISHPROFILE_C93B494C1D604DF58A1906DA560A3582` を更新
   - ダウンロードした `.PublishSettings` ファイルの内容をペースト

### 環境変数の設定

Azure Portal > App Service "app-kenq-freepoc-4" > 設定 > 構成 で以下を設定：

- `NEXTAUTH_URL`: https://app-kenq-freepoc-4-h9ahafbpb6aqa3d9.japaneast-01.azurewebsites.net
- `NEXTAUTH_SECRET`: 認証用のシークレット（ランダムな文字列）
- `NEXT_PUBLIC_API_URL`: https://app-kenq-freepoc-3-aqhzavcsf3gsgghs.japaneast-01.azurewebsites.net

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

GitHub リポジトリの Actions タブから「Build and deploy Node.js app to Azure Web App - app-kenq-freepoc-4」ワークフローを選択し、「Run workflow」をクリックすることで手動デプロイも可能です。

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
