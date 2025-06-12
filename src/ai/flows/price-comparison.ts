'use server';

/**
 * @fileOverview A product price comparison AI agent.
 *
 * - priceComparison - A function that handles the price comparison process.
 * - PriceComparisonInput - The input type for the priceComparison function.
 * - PriceComparisonOutput - The return type for the priceComparison function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PriceComparisonInputSchema = z.object({
  productLink: z
    .string()
    .describe('The link to the product to compare prices for.'),
});
export type PriceComparisonInput = z.infer<typeof PriceComparisonInputSchema>;

const PriceComparisonOutputSchema = z.object({
  prices: z.array(
    z.object({
      storeName: z.string().describe('The name of the store.'),
      price: z.number().describe('The price of the product at the store.'),
      url: z.string().url().describe('The URL to the product page at the store.'),
    })
  ).describe('A list of prices from different stores.'),
  cheapestStore: z.string().describe('The name of the store with the cheapest price.'),
  cheapestPrice: z.number().describe('The cheapest price found for the product.'),
});
export type PriceComparisonOutput = z.infer<typeof PriceComparisonOutputSchema>;

export async function priceComparison(input: PriceComparisonInput): Promise<PriceComparisonOutput> {
  return priceComparisonFlow(input);
}

const prompt = ai.definePrompt({
  name: 'priceComparisonPrompt',
  input: {schema: PriceComparisonInputSchema},
  output: {schema: PriceComparisonOutputSchema},
  prompt: `You are an expert price comparison agent. You will be given a link to a product and you will find the prices of the product from multiple stores.

  Product Link: {{{productLink}}}
  
  Return the prices in JSON format.
  {
    "prices": [
      {
        "storeName": "Store Name",
        "price": 99.99,
        "url": "https://www.store.com/product"
      }
    ],
    "cheapestStore": "Store Name",
    "cheapestPrice": 99.99
  }`,
});

const priceComparisonFlow = ai.defineFlow(
  {
    name: 'priceComparisonFlow',
    inputSchema: PriceComparisonInputSchema,
    outputSchema: PriceComparisonOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
