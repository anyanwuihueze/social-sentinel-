'use server';

/**
 * @fileOverview Generates a TikTok comment template tailored to the selected hashtag.
 *
 * - generateTikTokCommentTemplate - A function that generates a TikTok comment template.
 * - TikTokCommentTemplateInput - The input type for the generateTikTokCommentTemplate function.
 * - TikTokCommentTemplateOutput - The return type for the generateTikTokCommentTemplate function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TikTokCommentTemplateInputSchema = z.object({
  hashtag: z.string().describe('The TikTok hashtag to generate a comment template for.'),
});
export type TikTokCommentTemplateInput = z.infer<typeof TikTokCommentTemplateInputSchema>;

const TikTokCommentTemplateOutputSchema = z.object({
  commentTemplate: z.string().describe('The generated TikTok comment template.'),
});
export type TikTokCommentTemplateOutput = z.infer<typeof TikTokCommentTemplateOutputSchema>;

export async function generateTikTokCommentTemplate(input: TikTokCommentTemplateInput): Promise<TikTokCommentTemplateOutput> {
  return generateTikTokCommentTemplateFlow(input);
}

const prompt = ai.definePrompt({
  name: 'tiktokCommentTemplatePrompt',
  input: {schema: TikTokCommentTemplateInputSchema},
  output: {schema: TikTokCommentTemplateOutputSchema},
  prompt: `You are an expert social media manager. You generate TikTok comment templates that are short, helpful, and engaging.

  Generate a comment template for the following hashtag: {{{hashtag}}}

  The comment template should be no more than 200 characters.

  Comment Template:`,
});

const generateTikTokCommentTemplateFlow = ai.defineFlow(
  {
    name: 'generateTikTokCommentTemplateFlow',
    inputSchema: TikTokCommentTemplateInputSchema,
    outputSchema: TikTokCommentTemplateOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
