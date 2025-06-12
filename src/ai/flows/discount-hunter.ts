'use server';

/**
 * @fileOverview Discount code finder flow.
 *
 * - findDiscountCodes - A function that finds discount codes for a given product.
 * - FindDiscountCodesInput - The input type for the findDiscountCodes function.
 * - FindDiscountCodesOutput - The return type for the findDiscountCodes function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const FindDiscountCodesInputSchema = z.object({
  productName: z.string().describe('The name of the product to find discount codes for.'),
});
export type FindDiscountCodesInput = z.infer<typeof FindDiscountCodesInputSchema>;

const FindDiscountCodesOutputSchema = z.object({
  discountCodes: z.array(z.string()).describe('An array of discount codes for the product.'),
});
export type FindDiscountCodesOutput = z.infer<typeof FindDiscountCodesOutputSchema>;

export async function findDiscountCodes(input: FindDiscountCodesInput): Promise<FindDiscountCodesOutput> {
  return findDiscountCodesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'findDiscountCodesPrompt',
  input: {schema: FindDiscountCodesInputSchema},
  output: {schema: FindDiscountCodesOutputSchema},
  prompt: `You are a discount code finder. Find discount codes for the following product:

Product Name: {{{productName}}}

Return an array of discount codes that can be used for the product.  If no discount codes can be found, return an empty array.

Only return the codes in the array.  Do not include any other text.`,
});

const findDiscountCodesFlow = ai.defineFlow(
  {
    name: 'findDiscountCodesFlow',
    inputSchema: FindDiscountCodesInputSchema,
    outputSchema: FindDiscountCodesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
