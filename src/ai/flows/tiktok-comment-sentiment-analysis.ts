'use server';

/**
 * @fileOverview Analyzes the sentiment of a TikTok comment and returns the sentiment score.
 *
 * - analyzeTiktokCommentSentiment - A function that analyzes the sentiment of a TikTok comment.
 * - TiktokCommentSentimentAnalysisInput - The input type for the analyzeTiktokCommentSentiment function.
 * - TiktokCommentSentimentAnalysisOutput - The return type for the analyzeTiktokCommentSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import Sentiment from 'sentiment';

const TiktokCommentSentimentAnalysisInputSchema = z.object({
  comment: z.string().describe('The TikTok comment to analyze.'),
});
export type TiktokCommentSentimentAnalysisInput = z.infer<
  typeof TiktokCommentSentimentAnalysisInputSchema
>;

const TiktokCommentSentimentAnalysisOutputSchema = z.object({
  sentimentScore:
    z.number()
      .describe(
        'The sentiment score of the comment, ranging from -1 (negative) to 1 (positive).'
      ),
});
export type TiktokCommentSentimentAnalysisOutput = z.infer<
  typeof TiktokCommentSentimentAnalysisOutputSchema
>;

export async function analyzeTiktokCommentSentiment(
  input: TiktokCommentSentimentAnalysisInput
): Promise<TiktokCommentSentimentAnalysisOutput> {
  return tiktokCommentSentimentAnalysisFlow(input);
}

const sentiment = new Sentiment();

const tiktokCommentSentimentAnalysisFlow = ai.defineFlow(
  {
    name: 'tiktokCommentSentimentAnalysisFlow',
    inputSchema: TiktokCommentSentimentAnalysisInputSchema,
    outputSchema: TiktokCommentSentimentAnalysisOutputSchema,
  },
  async input => {
    const result = sentiment.analyze(input.comment);
    return {
      sentimentScore: result.score / 10, // scale it to -1..1
    };
  }
);
