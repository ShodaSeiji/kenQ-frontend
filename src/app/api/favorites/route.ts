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
    
    const apiUrl = process.env.API_URL;
    
    if (!apiUrl) {
      console.error('API URL not configured');
      return NextResponse.json(
        { error: 'API URLが設定されていません' },
        { status: 500 }
      );
    }

    const matchingId = body.matching_id;

    if (!matchingId) {
      return NextResponse.json(
        { error: 'matching_id is required' },
        { status: 400 }
      );
    }

    const response = await fetch(`${apiUrl}/favorites/${matchingId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', errorText);
      return NextResponse.json(
        { error: 'お気に入り登録中にエラーが発生しました' },
        { status: 500 }
      );
    }

    const result = await response.json();
    return NextResponse.json(result);

  } catch (error) {
    console.error('Favorites API error:', error);
    return NextResponse.json(
      { error: 'お気に入り登録中にエラーが発生しました' },
      { status: 500 }
    );
  }
}