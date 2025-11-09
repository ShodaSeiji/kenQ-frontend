import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  // Cookieまたはデフォルトロケールを使用
  const cookieStore = cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'ja';

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default
  };
});
