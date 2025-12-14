import { NextResponse } from 'next/server';

const BACKEND_URL = 'https://social-agents-1765342327.fly.dev';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/leads`);
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