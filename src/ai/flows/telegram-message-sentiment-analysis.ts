'use server';

/**
 * @fileOverview Analyzes the sentiment of Telegram messages to understand the emotional tone of the conversation.
 *
 * - analyzeSentiment - A function that analyzes the sentiment of a given text.
 * - SentimentAnalysisInput - The input type for the analyzeSentiment function.
 * - SentimentAnalysisOutput - The return type for the analyzeSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import sentiment from 'sentiment';

const SentimentAnalysisInputSchema = z.object({
  text: z.string().describe('The text to analyze for sentiment.'),
});
export type SentimentAnalysisInput = z.infer<typeof SentimentAnalysisInputSchema>;

const SentimentAnalysisOutputSchema = z.object({
  score: z.number().describe('The sentiment score of the text.  Positive is good, negative is bad.'),
  comparative: z.number().describe('The comparative sentiment score of the text.  Positive is good, negative is bad.'),
  tokens: z.array(z.string()).describe('The tokens of the text.'),
  words: z.array(z.string()).describe('The words of the text.'),
  positive: z.array(z.string()).describe('The positive words of the text.'),
  negative: z.array(z.string()).describe('The negative words of the text.'),
});
export type SentimentAnalysisOutput = z.infer<typeof SentimentAnalysisOutputSchema>;

export async function analyzeSentiment(input: SentimentAnalysisInput): Promise<SentimentAnalysisOutput> {
  return analyzeSentimentFlow(input);
}

const analyzeSentimentFlow = ai.defineFlow({
    name: 'analyzeSentimentFlow',
    inputSchema: SentimentAnalysisInputSchema,
    outputSchema: SentimentAnalysisOutputSchema,
  },
  async input => {
    const analysis = new sentiment();
    const result = analysis.analyze(input.text);
    return {
      score: result.score,
      comparative: result.comparative,
      tokens: result.tokens,
      words: result.words,
      positive: result.positive,
      negative: result.negative,
    };
  }
);
