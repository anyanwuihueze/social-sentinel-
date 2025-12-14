'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from './ui/badge';
import { Bot, MessageSquare, Flame, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LogEntry {
  id: string;
  source: 'telegram' | 'tiktok' | 'system';
  type: 'message' | 'reply' | 'system';
  content: string;
  sentiment?: number;
  timestamp: string;
}

export function LogPanel() {
  const [logs, setLogs] = useState<LogEntry[]>([{
    id: '1',
    source: 'system',
    type: 'system',
    content: '✅ Connected to your Telegram Agent',
    timestamp: new Date().toISOString()
  }]);
  const [isConnected, setIsConnected] = useState(true);

  useEffect(() => {
    const fetchRealLogs = async () => {
      try {
        // Fetch REAL messages from YOUR backend
        const response = await fetch('https://social-agents-1765342327.fly.dev/messages?limit=20');
        const data = await response.json();
        
        if (data.success && data.messages) {
          const realLogs = data.messages.map((msg: any, index: number) => ({
            id: msg.id?.toString() || `msg-${index}`,
            source: 'telegram' as const,
            type: 'message' as const,
            content: msg.message_text,
            sentiment: 0,
            timestamp: msg.created_at || new Date().toISOString()
          }));
          
          if (realLogs.length > 0) {
            setLogs(realLogs);
            setIsConnected(true);
          }
        }
      } catch (error) {
        console.error('Failed to fetch messages:', error);
        setIsConnected(false);
      }
    };

    fetchRealLogs();
    const interval = setInterval(fetchRealLogs, 5000);
    return () => clearInterval(interval);
  }, []);

  const getIcon = (log: LogEntry) => {
    if (log.type === 'reply') return <Bot className="h-4 w-4 text-blue-500" />;
    if (log.type === 'system') return <Flame className="h-4 w-4 text-orange-500" />;
    return <MessageSquare className="h-4 w-4 text-green-500" />;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>📡 Live Telegram Feed</CardTitle>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-500">Live</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-500">Reconnecting...</span>
            </>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] overflow-y-auto p-4 border rounded-md">
          <div className="flex flex-col gap-4">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <div className="mt-1">{getIcon(log)}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="secondary" className="text-xs">
                      {log.source}
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </div>
                  <p className={cn(
                    "break-words",
                    log.type === 'reply' && "text-blue-600 font-medium",
                    log.type === 'system' && "text-orange-600",
                    log.type === 'message' && "text-gray-800"
                  )}>
                    {log.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
