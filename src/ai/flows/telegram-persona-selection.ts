'use server';

/**
 * @fileOverview A flow for selecting a persona for the Telegram Visa Bot's responses.
 *
 * This file defines a Genkit flow that allows users to select a persona (Friendly, Expert, Peer) for the bot's
 * responses to tailor them to the target audience, improving engagement and effectiveness.
 *
 * @exported
 * - `TelegramPersonaSelectionInput`: The input type for the `telegramPersonaSelection` function.
 * - `TelegramPersonaSelectionOutput`: The output type for the `telegramPersonaSelection` function.
 * - `telegramPersonaSelection`: An async function that takes `TelegramPersonaSelectionInput` and returns `TelegramPersonaSelectionOutput`.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const TelegramPersonaSelectionInputSchema = z.object({
  persona:
    z.enum(['Friendly', 'Expert', 'Peer'])
      .describe('The persona to use for the bot responses.'),
  message: z.string().describe('The message to be tailored to the persona.'),
});

export type TelegramPersonaSelectionInput = z.infer<
  typeof TelegramPersonaSelectionInputSchema
>;

const TelegramPersonaSelectionOutputSchema = z.object({
  response: z.string().describe('The tailored response based on the selected persona.'),
});

export type TelegramPersonaSelectionOutput = z.infer<
  typeof TelegramPersonaSelectionOutputSchema
>;

const telegramPersonaSelectionPrompt = ai.definePrompt({
  name: 'telegramPersonaSelectionPrompt',
  input: {schema: TelegramPersonaSelectionInputSchema},
  output: {schema: TelegramPersonaSelectionOutputSchema},
  prompt: `You are a bot responding to user messages in a Telegram group.
Your persona is: {{{persona}}}.

Here's the message you need to respond to:
{{{message}}}

Respond in a way that is consistent with your persona.`,
});

const telegramPersonaSelectionFlow = ai.defineFlow(
  {
    name: 'telegramPersonaSelectionFlow',
    inputSchema: TelegramPersonaSelectionInputSchema,
    outputSchema: TelegramPersonaSelectionOutputSchema,
  },
  async input => {
    const {output} = await telegramPersonaSelectionPrompt(input);
    return output!;
  }
);

export async function telegramPersonaSelection(
  input: TelegramPersonaSelectionInput
): Promise<TelegramPersonaSelectionOutput> {
  return telegramPersonaSelectionFlow(input);
}
