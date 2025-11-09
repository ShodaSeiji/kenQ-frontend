import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const projectId = searchParams.get('project_id');
    const locale = searchParams.get('locale') || 'ja';  // デフォルトは日本語

    if (!projectId) {
      return NextResponse.json(
        { error: 'project_id is required' },
        { status: 400 }
      );
    }

    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
      console.error('API URL not configured');
      return NextResponse.json(
        { error: 'API URLが設定されていません' },
        { status: 500 }
      );
    }

    const response = await fetch(`${apiUrl}/matching-result/${projectId}?locale=${locale}`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error response:', errorText);
      console.error('Backend API error status:', response.status);
      return NextResponse.json(
        { error: 'マッチング結果取得中にエラーが発生しました', backendError: errorText },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Matching results API error:', error);
    return NextResponse.json(
      { error: 'マッチング結果取得中にエラーが発生しました' },
      { status: 500 }
    );
  }
}