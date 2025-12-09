import { config } from 'dotenv';
config();

import '@/ai/flows/telegram-message-sentiment-analysis.ts';
import '@/ai/flows/telegram-persona-selection.ts';
import '@/ai/flows/tiktok-comment-sentiment-analysis.ts';
import '@/ai/flows/tiktok-comment-template-generation.ts';