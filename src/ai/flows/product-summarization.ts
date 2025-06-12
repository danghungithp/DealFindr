'use server';

/**
 * @fileOverview An AI agent that summarizes product information from a given URL.
 *
 * - summarizeProduct - A function that takes a product URL and returns a concise summary of the product.
 * - ProductSummaryInput - The input type for the summarizeProduct function.
 * - ProductSummaryOutput - The return type for the summarizeProduct function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ProductSummaryInputSchema = z.object({
  productUrl: z
    .string()
    .url()
    .describe('The URL of the product to summarize.'),
});

export type ProductSummaryInput = z.infer<typeof ProductSummaryInputSchema>;

const ProductSummaryOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise summary of the product specifications and descriptions.'),
});

export type ProductSummaryOutput = z.infer<typeof ProductSummaryOutputSchema>;

export async function summarizeProduct(input: ProductSummaryInput): Promise<ProductSummaryOutput> {
  return productSummaryFlow(input);
}

const productSummaryPrompt = ai.definePrompt({
  name: 'productSummaryPrompt',
  input: {schema: ProductSummaryInputSchema},
  output: {schema: ProductSummaryOutputSchema},
  prompt: `You are an expert product summarizer.  Your job is to take a URL of a product page, and to create a concise summary of the product's specifications and descriptions.

Product URL: {{{productUrl}}}`,
});

const productSummaryFlow = ai.defineFlow(
  {
    name: 'productSummaryFlow',
    inputSchema: ProductSummaryInputSchema,
    outputSchema: ProductSummaryOutputSchema,
  },
  async input => {
    const {output} = await productSummaryPrompt(input);
    return output!;
  }
);
