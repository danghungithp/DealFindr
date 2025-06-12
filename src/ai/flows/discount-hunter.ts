
'use server';

/**
 * @fileOverview Discount code finder flow using Accesstrade API.
 *
 * - findDiscountCodes - A function that finds discount codes for Shopee via Accesstrade.
 * - FindDiscountCodesInput - The input type for the findDiscountCodes function.
 * - FindDiscountCodesOutput - The return type for the findDiscountCodes function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { fetchShopeeDiscountCodes, type FormattedCoupon } from '@/services/accesstrade';

const FindDiscountCodesInputSchema = z.object({
  productName: z.string().describe('The name of the product. Currently used to trigger the Shopee coupon search, but not for specific product filtering within this flow.'),
});
export type FindDiscountCodesInput = z.infer<typeof FindDiscountCodesInputSchema>;

const CouponSchema = z.object({
  code: z.string().describe('The discount coupon code.'),
  description: z.string().describe('The description of the discount.'),
  aff_link: z.string().url().describe('The affiliate link associated with the coupon/offer.'),
  offer_name: z.string().describe('The name of the offer providing the coupon.'),
  domain: z.string().describe('The domain for which the coupon is valid (e.g., shopee.vn).'),
  end_time: z.string().describe('The expiration date/time of the coupon.'),
});

const FindDiscountCodesOutputSchema = z.object({
  coupons: z.array(CouponSchema).describe('An array of discount coupons, primarily for Shopee from Accesstrade.'),
});
export type FindDiscountCodesOutput = z.infer<typeof FindDiscountCodesOutputSchema>;


export async function findDiscountCodes(input: FindDiscountCodesInput): Promise<FindDiscountCodesOutput> {
  // Input `productName` is available if needed in the future to select different domains or APIs.
  // For now, we are hardcoding to fetch Shopee codes.
  console.log(`Finding discount codes, triggered by search for: ${input.productName}`);
  return findDiscountCodesFlow(input);
}

const findDiscountCodesFlow = ai.defineFlow(
  {
    name: 'findDiscountCodesFlow',
    inputSchema: FindDiscountCodesInputSchema,
    outputSchema: FindDiscountCodesOutputSchema,
  },
  async (input) => {
    // Currently, input.productName is ignored, and we always fetch Shopee codes.
    // This could be expanded later to choose different domains or logic based on productName.
    const accesstradeCoupons: FormattedCoupon[] = await fetchShopeeDiscountCodes();
    
    // Adapt the fetched coupons to the flow's output schema.
    // The FormattedCoupon structure from the service already matches the CouponSchema here.
    return { coupons: accesstradeCoupons };
  }
);
