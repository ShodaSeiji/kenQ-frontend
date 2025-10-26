import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'ログインが必要です' },
        { status: 401 }
      );
    }

    const body = await req.json();
    
    // セッションからcompany_user_idを追加
    const bodyWithUserId = {
      ...body,
      company_user_id: parseInt(session.user.id, 10)
    };
    
    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
      console.error('API URL not configured');
      return NextResponse.json(
        { error: 'API URLが設定されていません' },
        { status: 500 }
      );
    }

    const response = await fetch(`${apiUrl}/ai-diagnosis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyWithUserId),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error response:', errorText);
      console.error('Backend API error status:', response.status);
      return NextResponse.json(
        { error: 'AI診断処理中にエラーが発生しました', backendError: errorText },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('AI diagnosis API error:', error);
    return NextResponse.json(
      { error: 'AI診断中にエラーが発生しました' },
      { status: 500 }
    );
  }
}