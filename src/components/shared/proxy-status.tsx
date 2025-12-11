'use client';

import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff } from 'lucide-react';

type Status = 'loading' | 'connected' | 'disconnected';

export function ProxyStatus() {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    async function checkProxy() {
      try {
        const response = await fetch('/api/proxy-test', {
          method: 'GET'  // Changed to GET since we fixed the API route
        });
        
        if (!response.ok) {
          throw new Error('Proxy test failed');
        }
        
        const data = await response.json();
        setStatus(data.status === 'connected' ? 'connected' : 'disconnected');
      } catch (error) {
        console.error('Proxy status check failed:', error);
        setStatus('disconnected');
      }
    }
    
    checkProxy();
  }, []);

  const getStatusContent = () => {
    switch (status) {
      case 'connected':
        return {
          text: 'Proxy: Connected',
          className: 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30',
          icon: <Wifi className="h-3 w-3" />,
        };
      case 'disconnected':
        return {
          text: 'Proxy: Disconnected',
          className: 'bg-red-500/20 text-red-700 dark:text-red-400 border-red-500/30',
          icon: <WifiOff className="h-3 w-3" />,
        };
      case 'loading':
      default:
        return {
          text: 'Proxy: Checking...',
          className: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30',
          icon: <div className="h-3 w-3 animate-pulse rounded-full bg-yellow-500" />,
        };
    }
  };

  const { text, className, icon } = getStatusContent();

  return (
    <Badge
      variant="outline"
      className={cn('flex items-center gap-1.5 transition-colors', className)}
    >
      {icon}
      <span>{text}</span>
    </Badge>
  );
}