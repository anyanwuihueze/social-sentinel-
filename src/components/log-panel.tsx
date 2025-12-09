'use client';

import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';
import { Bot, MessageSquare, Flame } from 'lucide-react';

interface LogEntry {
  id: string;
  source: 'telegram' | 'tiktok';
  type: 'message' | 'reply' | 'system';
  content: string;
  sentiment?: number;
  timestamp: string;
}

export function LogPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const eventSource = new EventSource('/api/logs');

    eventSource.onmessage = (event) => {
      try {
        const newLog = JSON.parse(event.data);
        setLogs((prevLogs) => [...prevLogs, newLog]);
      } catch (error) {
        console.error('Failed to parse log:', event.data);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [logs]);

  const getSentimentBadge = (sentiment?: number) => {
    if (sentiment === undefined) return null;
    if (sentiment > 0.3)
      return (
        <Badge variant="outline" className="border-green-500 text-green-500">
          Positive
        </Badge>
      );
    if (sentiment < -0.3)
      return (
        <Badge variant="outline" className="border-red-500 text-red-500">
          Negative
        </Badge>
      );
    return (
      <Badge variant="outline" className="border-yellow-500 text-yellow-500">
        Neutral
      </Badge>
    );
  };

  const getIcon = (log: LogEntry) => {
    if (log.type === 'reply') return <Bot className="h-4 w-4 text-primary" />;
    if (log.type === 'system') return <Flame className="h-4 w-4 text-destructive" />;
    return <MessageSquare className="h-4 w-4 text-muted-foreground" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Log</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] w-full rounded-md border p-4" ref={scrollAreaRef}>
          <div className="flex flex-col gap-4">
            {logs.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                <p>Waiting for logs...</p>
                <p className="text-sm">Start a monitor to see live activity.</p>
              </div>
            )}
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <div className="mt-1">{getIcon(log)}</div>
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <span className="font-medium capitalize text-foreground">{log.source} {log.type}</span>
                        <span className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleTimeString()}</span>
                        {getSentimentBadge(log.sentiment)}
                    </div>
                    <p className={cn("text-muted-foreground", log.type === 'reply' && "text-primary/90")}>{log.content}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
