import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || process.env.API_URL || "http://localhost:8000";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { researcher_ids } = body;

    console.log('Received researcher_ids:', researcher_ids);
    console.log('BACKEND_URL:', BACKEND_URL);

    if (!researcher_ids || !Array.isArray(researcher_ids)) {
      return NextResponse.json(
        { error: 'researcher_ids array is required' },
        { status: 400 }
      );
    }

    const backendUrl = `${BACKEND_URL}/researchers-en`;
    console.log('Fetching from backend:', backendUrl);

    // バックエンドのエンドポイントにリクエスト
    const response = await fetch(backendUrl, {
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
