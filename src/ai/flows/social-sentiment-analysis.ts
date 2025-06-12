'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing social media sentiment related to a product.
 *
 * - analyzeSocialSentiment - A function that takes a product name or link and returns a sentiment summary.
 * - SocialSentimentInput - The input type for the analyzeSocialSentiment function.
 * - SocialSentimentOutput - The return type for the analyzeSocialSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SocialSentimentInputSchema = z.object({
  productIdentifier: z
    .string()
    .describe('The name or link of the product to analyze social sentiment for.'),
});
export type SocialSentimentInput = z.infer<typeof SocialSentimentInputSchema>;

const SocialSentimentOutputSchema = z.object({
  sentimentSummary: z
    .string()
    .describe(
      'A summary of the overall sentiment towards the product on social media platforms.'
    ),
  positiveHighlights: z.string().describe('Highlights of positive feedback.'),
  negativeHighlights: z.string().describe('Highlights of negative feedback.'),
});
export type SocialSentimentOutput = z.infer<typeof SocialSentimentOutputSchema>;

export async function analyzeSocialSentiment(
  input: SocialSentimentInput
): Promise<SocialSentimentOutput> {
  return analyzeSocialSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'socialSentimentPrompt',
  input: {schema: SocialSentimentInputSchema},
  output: {schema: SocialSentimentOutputSchema},
  prompt: `You are an AI assistant specializing in analyzing social media sentiment.

  Analyze social media platforms to determine the overall public sentiment towards the following product:

  Product: {{{productIdentifier}}}

  Provide a concise summary of the overall sentiment, highlighting both positive and negative feedback.
  Do not mention that you are an AI. Focus on providing an insightful analysis that a human social media analyst would produce.
  Remember to include details about customer experiences, potential issues and make suggestions to customers.
  The sentiment summary must be less than 200 words.
  Positive and negative feedback sections must be less than 100 words each.
  `,
});

const analyzeSocialSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeSocialSentimentFlow',
    inputSchema: SocialSentimentInputSchema,
    outputSchema: SocialSentimentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
