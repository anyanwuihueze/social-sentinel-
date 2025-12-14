import { NextResponse } from 'next/server';

const BACKEND_URL = 'https://social-agents-1765342327.fly.dev';

export async function GET(request: Request) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Fetch recent messages every 2 seconds
        const interval = setInterval(async () => {
          try {
            const response = await fetch(`${BACKEND_URL}/messages?limit=20`);
            const data = await response.json();

            if (data.success && data.messages) {
              // Convert to log format
              data.messages.forEach((msg: any) => {
                const logEntry = {
                  id: `${msg.chat_id}-${msg.created_at}`,
                  source: 'telegram' as const,
                  type: 'message' as const,
                  content: msg.message_text,
                  sentiment: 0,
                  timestamp: msg.created_at
                };
                
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify(logEntry)}\n\n`)
                );
              });
            }
          } catch (error) {
            console.error('Log fetch error:', error);
          }
        }, 2000);

        // Cleanup on disconnect
        request.signal.addEventListener('abort', () => {
          clearInterval(interval);
          controller.close();
        });
      } catch (error) {
        controller.error(error);
      }
    }
  });

  return new NextResponse(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}