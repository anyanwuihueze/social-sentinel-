'use client';

import { useState } from 'react';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
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
import { X, BotMessageSquare } from 'lucide-react';
import { LogPanel } from '@/components/log-panel';
import { useToast } from '@/hooks/use-toast';

const qrImage = PlaceHolderImages.find((img) => img.id === 'telegram-qr');

export default function TelegramVisaPage() {
  const { toast } = useToast();
  const [inviteLinks, setInviteLinks] = useState('');
  const [keywords, setKeywords] = useState([
    'visa',
    'us visa',
    'interview',
    'denied',
    'schengen',
  ]);
  const [newKeyword, setNewKeyword] = useState('');
  const [sentiment, setSentiment] = useState([0]);
  const [persona, setPersona] = useState('Friendly');
  const [isMonitoring, setIsMonitoring] = useState(false);

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
    setIsMonitoring(true);
    toast({
      title: 'Starting Telegram Monitor...',
      description: 'The bot is getting ready to monitor groups.',
    });

    const response = await fetch('/api/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ inviteLinks, keywords, sentiment: sentiment[0], persona }),
    });

    if (response.ok) {
        toast({
            title: 'Telegram Monitor Started!',
            description: 'The bot is now live and monitoring.',
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Error starting monitor',
            description: 'Could not start the Telegram bot. Check console for details.',
        });
        setIsMonitoring(false);
    }
    // In a real app, you would handle stopping the monitor as well
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <BotMessageSquare className="h-12 w-12 text-primary mx-auto mb-2" />
        <h1 className="text-4xl font-bold tracking-tighter font-headline">
          Telegram Visa Bot
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Configure and launch your AI-powered Telegram monitor.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Set up the parameters for the Telegram bot.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="invite-links">Group Invite Links</Label>
                <Input
                  id="invite-links"
                  placeholder="https://t.me/..., https://t.me/..."
                  value={inviteLinks}
                  onChange={(e) => setInviteLinks(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Comma-separated list of Telegram group invite links.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Keywords</Label>
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
                <Label htmlFor="sentiment">Sentiment Threshold</Label>
                <Slider
                  id="sentiment"
                  min={-1}
                  max={1}
                  step={0.1}
                  value={sentiment}
                  onValueChange={setSentiment}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Negative (-1)</span>
                  <span>Neutral ({sentiment[0]})</span>
                  <span>Positive (1)</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="persona">Bot Persona</Label>
                <Select value={persona} onValueChange={setPersona}>
                  <SelectTrigger id="persona" className="w-[180px]">
                    <SelectValue placeholder="Select Persona" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Friendly">Friendly</SelectItem>
                    <SelectItem value="Expert">Expert</SelectItem>
                    <SelectItem value="Peer">Peer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button onClick={handleStartMonitor} disabled={isMonitoring} size="lg">
                {isMonitoring ? 'Monitoring...' : 'Start Monitor'}
              </Button>
            </CardContent>
          </Card>
          
          <LogPanel />
        </div>
        
        <div className="space-y-8">
            <Card className="text-center">
                <CardHeader>
                    <CardTitle>Scan to Login</CardTitle>
                    <CardDescription>Use your phone to scan the QR code and log in to Telegram Web.</CardDescription>
                </CardHeader>
                <CardContent>
                    {qrImage && (
                        <div id="tg-qr" className="p-4 border rounded-lg bg-background inline-block">
                        <Image
                            src={qrImage.imageUrl}
                            alt={qrImage.description}
                            data-ai-hint={qrImage.imageHint}
                            width={256}
                            height={256}
                            className="rounded-md"
                        />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
