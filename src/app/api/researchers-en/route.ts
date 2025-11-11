import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { researcher_ids } = body;

    if (!researcher_ids || !Array.isArray(researcher_ids)) {
      return NextResponse.json(
        { error: 'researcher_ids array is required' },
        { status: 400 }
      );
    }

    // バックエンドのエンドポイントにリクエスト
    const response = await fetch(`${BACKEND_URL}/researchers-en`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ researcher_ids }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch English researcher data' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Researchers EN API error:', error);
    return NextResponse.json(
      { error: 'An error occurred while fetching English researcher data' },
      { status: 500 }
    );
  }
}
