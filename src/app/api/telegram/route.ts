import { NextResponse } from 'next/server';

const BACKEND_URL = 'https://social-agents-1765342327.fly.dev';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { keywords, sentiment, persona } = body;

    // Update backend config
    const response = await fetch(`${BACKEND_URL}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keywords: keywords || ['visa', 'interview', 'appointment'],
        persona: persona?.toLowerCase() || 'peer',
        sentimentThreshold: sentiment || -0.3,
        aiEnabled: true
      })
    });

    if (!response.ok) {
      throw new Error('Failed to update config');
    }

    // Start agent if not running
    await fetch(`${BACKEND_URL}/start`);

    return NextResponse.json({ 
      success: true, 
      message: 'Agent configured and started' 
    });
  } catch (error: unknown) {
    console.error('Telegram API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, message: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/stats`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}