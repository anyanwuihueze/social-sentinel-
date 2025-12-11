import { NextResponse } from 'next/server';

// Shared logic
async function handleProxyCheck() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

  try {
    const response = await fetch('https://social-agents-1765342327.fly.dev/health', {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Fly.io backend responded with ${response.status}`);
    }
    
    const healthData = await response.json();
    
    return NextResponse.json({
      status: 'connected',
      backend: 'Fly.io',
      health: healthData,
      message: 'Social media scrapers backend is running',
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    clearTimeout(timeoutId);
    console.error('Proxy test failed:', error.message);
    
    return NextResponse.json({
      status: 'disconnected',
      error: 'Cannot reach Fly.io backend',
      details: error.message,
      suggestion: 'Check if social-agents-1765342327.fly.dev is running',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// Handle both GET and POST
export async function GET() {
  return await handleProxyCheck();
}

export async function POST() {
  return await handleProxyCheck();
}