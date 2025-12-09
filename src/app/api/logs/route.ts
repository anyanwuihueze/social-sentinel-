export const dynamic = 'force-dynamic'; // defaults to auto

// Note: In a real application, you would use a message queue or a pub/sub system
// to push logs from your bot processes to this SSE endpoint.
// For this example, we're mocking logs being generated.

const mockSources: Array<'telegram' | 'tiktok'> = ['telegram', 'tiktok'];
const mockTypes: Array<'message' | 'reply' | 'system'> = ['message', 'reply', 'system'];
const mockMessages = [
  "I got my visa denied, what should I do?",
  "This is great news!",
  "Replying with helpful information.",
  "Starting to monitor new group: Visa Seekers",
  "Error: Could not join group, invite link expired.",
  "Found a comment with negative sentiment.",
];

function createMockLog(): any {
  const source = mockSources[Math.floor(Math.random() * mockSources.length)];
  const type = mockTypes[Math.floor(Math.random() * mockTypes.length)];
  const content = mockMessages[Math.floor(Math.random() * mockMessages.length)];
  const sentiment = type === 'message' ? Math.random() * 2 - 1 : undefined;

  return {
    id: crypto.randomUUID(),
    source,
    type,
    content,
    sentiment,
    timestamp: new Date().toISOString(),
  };
}


export async function GET(request: Request) {
  const stream = new ReadableStream({
    start(controller) {
      const intervalId = setInterval(() => {
        const log = createMockLog();
        controller.enqueue(`data: ${JSON.stringify(log)}\n\n`);
      }, 2000 + Math.random() * 3000); // Send a new log every 2-5 seconds

      request.signal.onabort = () => {
        clearInterval(intervalId);
        controller.close();
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
