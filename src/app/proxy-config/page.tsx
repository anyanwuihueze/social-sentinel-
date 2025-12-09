'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { saveProxyConfig } from './actions';
import { Server, CheckCircle, XCircle, Loader2 } from 'lucide-react';

type TestStatus = 'idle' | 'loading' | 'success' | 'error';
interface TestResult {
  status: 'connected' | 'disconnected';
  ip: string;
  proxyUrl: string | null;
}

export default function ProxyConfigPage() {
  const { toast } = useToast();
  const [proxyUrl, setProxyUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [testStatus, setTestStatus] = useState<TestStatus>('idle');
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const result = await saveProxyConfig(proxyUrl);
      toast({
        title: 'Configuration Saved',
        description: 'Your proxy URL has been updated. This will apply on the next server restart.',
      });
      console.log(result.message);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Save Failed',
        description: 'Could not save the proxy configuration.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    setTestStatus('loading');
    setTestResult(null);
    try {
      // NOTE: This test uses the proxy configured on the server via environment variables,
      // not the value from the input field directly. You must save and restart the server
      // for a new proxy to be tested.
      const response = await fetch('/api/proxy-test');
      if (!response.ok) {
        throw new Error('Proxy test request failed');
      }
      const data = await response.json();
      setTestResult(data);
      setTestStatus('success');
      toast({
        title: 'Proxy Test Complete',
        description: `Status: ${data.status}`,
      });
    } catch (error) {
      setTestStatus('error');
      toast({
        variant: 'destructive',
        title: 'Proxy Test Failed',
        description: 'Could not connect or verify the proxy.',
      });
    }
  };

  const renderTestResult = () => {
    switch (testStatus) {
      case 'loading':
        return (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Testing proxy connection...</p>
          </div>
        );
      case 'success':
        if (!testResult) return null;
        return (
          <div className="p-6">
            <div className="flex items-center mb-4">
              {testResult.status === 'connected' ? (
                <CheckCircle className="h-8 w-8 text-green-500 mr-4" />
              ) : (
                <XCircle className="h-8 w-8 text-red-500 mr-4" />
              )}
              <h3 className="text-2xl font-semibold">
                Status: <span className={testResult.status === 'connected' ? 'text-green-500' : 'text-red-500'}>
                  {testResult.status === 'connected' ? 'Connected' : 'Disconnected'}
                </span>
              </h3>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong className="font-medium text-foreground">Detected IP:</strong> <span className="text-muted-foreground">{testResult.ip}</span></p>
              <p><strong className="font-medium text-foreground">Proxy URL:</strong> <span className="text-muted-foreground">{testResult.proxyUrl || 'N/A'}</span></p>
            </div>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center justify-center p-8 text-red-500">
            <XCircle className="h-8 w-8 mr-4" />
            <p>The proxy test failed. Please check your URL and server logs.</p>
          </div>
        );
      case 'idle':
      default:
        return (
          <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
            <Server className="h-10 w-10 mb-2" />
            <p>Click "Test Proxy" to check the current server configuration.</p>
          </div>
        );
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <Server className="h-12 w-12 text-primary mx-auto mb-2" />
        <h1 className="text-4xl font-bold tracking-tighter font-headline">
          Proxy Configuration
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Manage and test your proxy connection.
        </p>
      </div>

      <div className="max-w-2xl mx-auto grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Proxy Settings</CardTitle>
            <CardDescription>
              Set the proxy URL for all bot operations. Changes require a server restart to take effect.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="proxy-url">Proxy URL</Label>
                <Input
                  id="proxy-url"
                  placeholder="http://user:pass@host:port"
                  value={proxyUrl}
                  onChange={(e) => setProxyUrl(e.target.value)}
                />
              </div>
              <div className="flex gap-4">
                <Button type="submit" disabled={isSaving || !proxyUrl}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Save Configuration
                </Button>
                <Button type="button" variant="outline" onClick={handleTest}>
                  Test Proxy
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>
              This shows the status of the proxy currently configured on the server.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {renderTestResult()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
