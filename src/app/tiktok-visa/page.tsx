'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Film } from 'lucide-react';
import { LogPanel } from '@/components/log-panel';
import { useToast } from '@/hooks/use-toast';

export default function TikTokVisaPage() {
  const { toast } = useToast();
  const [hashtags, setHashtags] = useState(['#usvisa', '#schengenvisa']);
  const [newHashtag, setNewHashtag] = useState('');
  const [maxComments, setMaxComments] = useState([20]);
  const [commentTemplate, setCommentTemplate] = useState(
    'I felt the same until I found this service that really helped me with my application process. Check them out!'
  );
  const [sentimentThreshold, setSentimentThreshold] = useState([-0.2]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const handleAddHashtag = () => {
    let tag = newHashtag.startsWith('#') ? newHashtag : `#${newHashtag}`;
    tag = tag.replace(/\s/g, '');
    if (tag.length > 1 && !hashtags.includes(tag.toLowerCase())) {
      setHashtags([...hashtags, tag.toLowerCase()]);
      setNewHashtag('');
    }
  };

  const handleRemoveHashtag = (tagToRemove: string) => {
    setHashtags(hashtags.filter((tag) => tag !== tagToRemove));
  };
  
  const handleStartMonitor = async () => {
    setIsMonitoring(true);
    toast({
      title: 'Starting TikTok Monitor...',
      description: 'The bot is getting ready to scan comments.',
    });

    const response = await fetch('/api/tiktok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hashtags, maxComments: maxComments[0], commentTemplate, sentimentThreshold: sentimentThreshold[0] }),
    });

    if (response.ok) {
        toast({
            title: 'TikTok Monitor Started!',
            description: 'The bot is now live and monitoring.',
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Error starting monitor',
            description: 'Could not start the TikTok bot. Check console for details.',
        });
        setIsMonitoring(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <Film className="h-12 w-12 text-primary mx-auto mb-2" />
        <h1 className="text-4xl font-bold tracking-tighter font-headline">
          TikTok Visa Bot
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Configure and launch your AI-powered TikTok comment bot.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
              <CardDescription>Set up the parameters for the TikTok bot.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Hashtags</Label>
                <div className="flex flex-wrap gap-2">
                  {hashtags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-base">
                      {tag}
                      <button onClick={() => handleRemoveHashtag(tag)} className="ml-2">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder="Add a hashtag"
                    value={newHashtag}
                    onChange={(e) => setNewHashtag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddHashtag()}
                  />
                  <Button onClick={handleAddHashtag} variant="outline">Add</Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-comments">Max Daily Comments</Label>
                <Slider
                  id="max-comments"
                  min={5}
                  max={50}
                  step={1}
                  value={maxComments}
                  onValueChange={setMaxComments}
                />
                <div className="text-center text-sm text-muted-foreground">
                  Up to {maxComments[0]} comments per day
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="comment-template">Comment Template</Label>
                <Textarea
                  id="comment-template"
                  placeholder="Your engaging comment goes here..."
                  value={commentTemplate}
                  onChange={(e) => setCommentTemplate(e.target.value)}
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sentiment-threshold">Sentiment Threshold</Label>
                <Slider
                  id="sentiment-threshold"
                  min={-1}
                  max={1}
                  step={0.1}
                  value={sentimentThreshold}
                  onValueChange={setSentimentThreshold}
                />
                <p className="text-sm text-muted-foreground">
                  The bot will reply to comments with a sentiment score below {sentimentThreshold[0]}.
                </p>
              </div>

              <Button onClick={handleStartMonitor} disabled={isMonitoring} size="lg">
                {isMonitoring ? 'Scanning...' : 'Start Monitor'}
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-1">
          <LogPanel />
        </div>
      </div>
    </div>
  );
}
