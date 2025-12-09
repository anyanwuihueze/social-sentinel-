import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowRight, BotMessageSquare, Film } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mb-4 font-headline">
          Welcome to Social Sentinel
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
          Your intelligent assistant for monitoring social media platforms.
          Choose a bot below to get started.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Link href="/telegram-visa" className="group">
          <Card className="h-full hover:border-primary transition-colors duration-300 transform hover:-translate-y-1">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <BotMessageSquare className="h-8 w-8 text-primary" />
                    <CardTitle className="text-2xl font-headline">
                      Telegram Visa Bot
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Monitor Telegram groups for visa-related keywords and
                    auto-reply.
                  </CardDescription>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
              </div>
            </CardHeader>
          </Card>
        </Link>

        <Link href="/tiktok-visa" className="group">
          <Card className="h-full hover:border-primary transition-colors duration-300 transform hover:-translate-y-1">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Film className="h-8 w-8 text-primary" />
                    <CardTitle className="text-2xl font-headline">
                      TikTok Visa Bot
                    </CardTitle>
                  </div>
                  <CardDescription>
                    Scan TikTok comments for sentiment and engage with your
                    audience.
                  </CardDescription>
                </div>
                <ArrowRight className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
              </div>
            </CardHeader>
          </Card>
        </Link>
      </div>
    </div>
  );
}
