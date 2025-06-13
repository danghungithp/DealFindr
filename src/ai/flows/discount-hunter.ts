
'use server';

/**
 * @fileOverview Discount code finder flow using Accesstrade API for Shopee.
 * This flow fetches all available Shopee vouchers via Accesstrade,
 * irrespective of the input product name.
 *
 * - findDiscountCodes - A function that finds discount codes for Shopee via Accesstrade.
 * - FindDiscountCodesInput - The input type for the findDiscountCodes function.
 * - FindDiscountCodesOutput - The return type for the findDiscountCodes function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { fetchShopeeVouchers, type FormattedCoupon } from '@/services/accesstrade'; // Updated import

const FindDiscountCodesInputSchema = z.object({
  productName: z.string().describe('The name of the product. This input is used to trigger the flow but does not filter the vouchers fetched, which are always for Shopee.'),
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
  console.log(`Finding all available Shopee discount codes from Accesstrade, triggered by search for: ${input.productName} (product name is not used for filtering).`);
  return findDiscountCodesFlow(input);
}

const findDiscountCodesFlow = ai.defineFlow(
  {
    name: 'findDiscountCodesFlow',
    inputSchema: FindDiscountCodesInputSchema,
    outputSchema: FindDiscountCodesOutputSchema,
  },
  async (input) => {
    // input.productName is ignored; we always fetch all available Shopee vouchers.
    const accesstradeCoupons: FormattedCoupon[] = await fetchShopeeVouchers(); // Updated service call
    
    return { coupons: accesstradeCoupons };
  }
);

