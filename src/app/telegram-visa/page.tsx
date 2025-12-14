'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, BotMessageSquare, Activity, Users, MessageSquare } from 'lucide-react';
import { LogPanel } from '@/components/log-panel';
import { useToast } from '@/hooks/use-toast';

export default function TelegramVisaPage() {
  const { toast } = useToast();
  const [keywords, setKeywords] = useState([
    'visa', 'interview', 'appointment', 'embassy', 'denied', 'rejected'
  ]);
  const [newKeyword, setNewKeyword] = useState('');
  const [sentiment, setSentiment] = useState([-0.3]);
  const [persona, setPersona] = useState('peer');
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalReplies: 0,
    leadsGenerated: 0,
    status: 'stopped'
  });

  useEffect(() => {
    // Fetch stats every 5 seconds
    const interval = setInterval(async () => {
      try {
        const response = await fetch('/api/telegram');
        const data = await response.json();
        if (data.success) {
          setStats(data.stats);
          setIsMonitoring(data.stats.status === 'connected');
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleAddKeyword = () => {
    if (newKeyword && !keywords.includes(newKeyword.toLowerCase())) {
      setKeywords([...keywords, newKeyword.toLowerCase()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setKeywords(keywords.filter((keyword) => keyword !== keywordToRemove));
  };
  
  const handleStartMonitor = async () => {
    try {
      const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          keywords, 
          sentiment: sentiment[0], 
          persona 
        }),
      });

      if (response.ok) {
        setIsMonitoring(true);
        toast({
          title: '🎉 Agent Started!',
          description: 'Your Telegram agent is now monitoring groups.',
        });
      } else {
        throw new Error('Failed to start agent');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not start agent. Check console for details.',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <BotMessageSquare className="h-12 w-12 text-primary mx-auto mb-2" />
        <h1 className="text-4xl font-bold tracking-tighter font-headline">
          Telegram Visa Agent
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          AI-powered peer helping visa applicants in real-time
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-2xl font-bold">
                  {stats.status === 'connected' ? '🟢 Live' : '⚪ Stopped'}
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Messages</p>
                <p className="text-2xl font-bold">{stats.totalMessages}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Replies</p>
                <p className="text-2xl font-bold">{stats.totalReplies}</p>
              </div>
              <BotMessageSquare className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Leads</p>
                <p className="text-2xl font-bold">{stats.leadsGenerated}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Agent Configuration</CardTitle>
              <CardDescription>Configure your AI agent's behavior</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Keywords to Monitor</Label>
                <div className="flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <Badge key={keyword} variant="secondary" className="text-base">
                      {keyword}
                      <button onClick={() => handleRemoveKeyword(keyword)} className="ml-2">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder="Add a keyword"
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddKeyword()}
                  />
                  <Button onClick={handleAddKeyword} variant="outline">Add</Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="sentiment">Reply to Frustration Level</Label>
                <Slider
                  id="sentiment"
                  min={-1}
                  max={0}
                  step={0.1}
                  value={sentiment}
                  onValueChange={setSentiment}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Very Frustrated</span>
                  <span>Current: {sentiment[0]}</span>
                  <span>Neutral</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="persona">Agent Persona</Label>
                <Select value={persona} onValueChange={setPersona}>
                  <SelectTrigger id="persona">
                    <SelectValue placeholder="Select Persona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="peer">Peer (Casual, went through it)</SelectItem>
                    <SelectItem value="expert">Expert (Professional consultant)</SelectItem>
                    <SelectItem value="friendly">Friendly (Warm & supportive)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleStartMonitor} 
                disabled={isMonitoring} 
                size="lg"
                className="w-full"
              >
                {isMonitoring ? '🟢 Agent Running' : 'Start Agent'}
              </Button>
            </CardContent>
          </Card>
          
          <LogPanel />
        </div>
        
        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>How It Works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium mb-1">1️⃣ Monitoring</p>
                <p className="text-muted-foreground">Agent listens to all your Telegram groups 24/7</p>
              </div>
              <div>
                <p className="font-medium mb-1">2️⃣ Detection</p>
                <p className="text-muted-foreground">Finds people asking about visas with your keywords</p>
              </div>
              <div>
                <p className="font-medium mb-1">3️⃣ Analysis</p>
                <p className="text-muted-foreground">Checks frustration level (only helps frustrated users)</p>
              </div>
              <div>
                <p className="font-medium mb-1">4️⃣ Response</p>
                <p className="text-muted-foreground">AI replies naturally, softly nudges to your site</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Setup</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Persona:</span>
                <span className="font-medium capitalize">{persona}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Keywords:</span>
                <span className="font-medium">{keywords.length} active</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Max Replies/Hour:</span>
                <span className="font-medium">10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">AI Enabled:</span>
                <span className="font-medium">✅ Yes</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}