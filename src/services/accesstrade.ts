
'use server';

import { z } from 'genkit';

const AccesstradeCouponSchema = z.object({
  coupon_code: z.string(),
  coupon_desc: z.string(),
});

const CategorySchema = z.object({
  category_name: z.string(),
  category_name_show: z.string(),
  category_no: z.string(),
});

const AccesstradeOfferSchema = z.object({
  aff_link: z.string().url(),
  banners: z.array(z.any()).optional(), // Can be more specific if banner structure is known
  categories: z.array(CategorySchema).optional(),
  content: z.string(),
  coupons: z.array(AccesstradeCouponSchema),
  domain: z.string(),
  end_time: z.string(),
  id: z.string(),
  image: z.string().url().optional(),
  link: z.string().url(),
  merchant: z.string(),
  name: z.string(),
  start_time: z.string(),
});

const AccesstradeApiResponseSchema = z.object({
  data: z.array(AccesstradeOfferSchema),
});

export interface FormattedCoupon {
  code: string;
  description: string;
  aff_link: string;
  offer_name: string;
  domain: string;
  end_time: string;
}

export async function fetchShopeeVouchers(): Promise<FormattedCoupon[]> {
  const apiUrl = 'https://api.accesstrade.vn/v1/offers_informations?domain=shopee.vn';
  const apiToken = process.env.ACCESSTRADE_API_TOKEN;

  if (!apiToken) {
    console.error('Accesstrade API token is not configured.');
    return [];
  }

  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Token ${apiToken}`,
      },
      cache: 'no-store', 
    });

    if (!response.ok) {
      console.error(`Error fetching Accesstrade data: ${response.status} ${response.statusText}`);
      const errorBody = await response.text();
      console.error('Error body:', errorBody);
      return [];
    }

    const rawData = await response.json();
    const parsedData = AccesstradeApiResponseSchema.safeParse(rawData);

    if (!parsedData.success) {
      console.error('Failed to parse Accesstrade API response:', parsedData.error.format());
      return [];
    }

    const allFormattedCoupons: FormattedCoupon[] = [];
    parsedData.data.forEach(offer => {
      offer.coupons.forEach(coupon => {
        allFormattedCoupons.push({
          code: coupon.coupon_code,
          description: coupon.coupon_desc,
          aff_link: offer.aff_link,
          offer_name: offer.name, // Using offer.name for the coupon's offer context
          domain: offer.domain,
          end_time: offer.end_time,
        });
      });
    });
    
    return allFormattedCoupons;

  } catch (error) {
    console.error('Exception during Accesstrade API call:', error);
    return [];
  }
}

