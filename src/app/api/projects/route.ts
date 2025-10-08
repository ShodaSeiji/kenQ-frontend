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
    const companyId = searchParams.get('company_id') || session.user.company_id;

    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
      console.error('API URL not configured');
      return NextResponse.json(
        { error: '担当者にご連絡ください' },
        { status: 500 }
      );
    }

    const response = await fetch(`${apiUrl}/project-info/${companyId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('プロジェクト取得エラー:', error);
    return NextResponse.json(
      { error: '担当者にご連絡ください' },
      { status: 500 }
    );
  }
}