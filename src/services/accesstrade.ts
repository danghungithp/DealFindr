
'use server';

import { z } from 'genkit';

const AccesstradeCouponSchema = z.object({
  coupon_code: z.string(),
  coupon_desc: z.string(),
});

const AccesstradeOfferSchema = z.object({
  aff_link: z.string().url(),
  coupons: z.array(AccesstradeCouponSchema),
  name: z.string(),
  content: z.string(),
  domain: z.string(),
  end_time: z.string(),
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

const FREE_SHIPPING_KEYWORDS = [
  "miễn phí vận chuyển",
  "freeship",
  "free ship",
  "miễn ship",
  "miễn phí giao hàng",
  "giao hàng miễn phí",
  "mpvc"
];

function isFreeShippingCoupon(coupon: FormattedCoupon): boolean {
  const searchText = `${coupon.description.toLowerCase()} ${coupon.offer_name.toLowerCase()}`;
  return FREE_SHIPPING_KEYWORDS.some(keyword => searchText.includes(keyword));
}

export async function fetchShopeeDiscountCodes(): Promise<FormattedCoupon[]> {
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
      cache: 'no-store', // Fetch fresh data each time
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
      console.error('Failed to parse Accesstrade API response:', parsedData.error);
      return [];
    }

    const allFormattedCoupons: FormattedCoupon[] = [];
    parsedData.data.forEach(offer => {
      offer.coupons.forEach(coupon => {
        allFormattedCoupons.push({
          code: coupon.coupon_code,
          description: coupon.coupon_desc,
          aff_link: offer.aff_link,
          offer_name: offer.name,
          domain: offer.domain,
          end_time: offer.end_time,
        });
      });
    });
    
    const freeShippingCoupons = allFormattedCoupons.filter(isFreeShippingCoupon);
    return freeShippingCoupons;

  } catch (error) {
    console.error('Exception during Accesstrade API call:', error);
    return [];
  }
}

