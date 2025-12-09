import { Readable } from 'stream';

// tiny SSE helper
let stream: Readable | null = null;

export function initSSE(res: any) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  stream = res;
}

export function logSSE(data: any) {
  if (stream) stream.write(`data: ${JSON.stringify(data)}\n\n`);
}
