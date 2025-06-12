
'use server';

/**
 * @fileOverview A product listing utility using DuckDuckGo search.
 *
 * - priceComparison - A function that lists products for a search keyword
 *   from Google Shopping using DuckDuckGo.
 * - PriceComparisonInput - The input type for the priceComparison function.
 * - PriceComparisonOutput - The return type for the priceComparison function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { duckDuckGoSearchTool, type DuckDuckGoSearchOutput, type DuckDuckGoSearchResult } from '@/ai/tools/duckduckgo-search-tool';

const PriceComparisonInputSchema = z.object({
  productIdentifier: z
    .string()
    .describe('Từ khóa tìm kiếm sản phẩm hoặc URL sản phẩm.'),
});
export type PriceComparisonInput = z.infer<typeof PriceComparisonInputSchema>;

const ProductPriceInfoSchema = z.object({
  productName: z.string().describe('Tên sản phẩm từ kết quả tìm kiếm.'),
  storeName: z.string().describe('Tên cửa hàng/website (ví dụ: Google Shopping).'),
  price: z.number().default(0).describe('Giá sản phẩm. Mặc định là 0 do không có phân tích AI.'),
  url: z.string().url().describe('URL trực tiếp đến trang sản phẩm hoặc kết quả tìm kiếm.'),
  snippet: z.string().optional().describe('Mô tả ngắn từ kết quả tìm kiếm (nếu có).'),
});
export type ProductPriceInfo = z.infer<typeof ProductPriceInfoSchema>;

const PriceComparisonOutputSchema = z.object({
  items: z.array(ProductPriceInfoSchema).describe('Danh sách các sản phẩm tìm thấy.'),
  searchContext: z.string().describe("Thông tin về truy vấn tìm kiếm đã được thực hiện."),
});
export type PriceComparisonOutput = z.infer<typeof PriceComparisonOutputSchema>;

export async function priceComparison(input: PriceComparisonInput): Promise<PriceComparisonOutput> {
  return priceComparisonFlow(input);
}

// Changed target to Google Shopping
const TARGET_SEARCH_DOMAINS = ['google.com/shopping'];

const priceComparisonFlow = ai.defineFlow(
  {
    name: 'priceComparisonFlow',
    inputSchema: PriceComparisonInputSchema,
    outputSchema: PriceComparisonOutputSchema,
  },
  async (input): Promise<PriceComparisonOutput> => {
    console.log(`[priceComparisonFlow] Received productIdentifier for Google Shopping search: ${input.productIdentifier}`);
    
    const rawSearchResults: DuckDuckGoSearchOutput = await duckDuckGoSearchTool({ 
      query: input.productIdentifier,
      domains: TARGET_SEARCH_DOMAINS 
    });

    console.log(`[priceComparisonFlow] DuckDuckGo returned ${rawSearchResults.length} results from Google Shopping.`);

    if (rawSearchResults.length === 0) {
      return {
        items: [],
        searchContext: `Không tìm thấy kết quả nào cho "${input.productIdentifier}" trên Google Shopping.`,
      };
    }
    
    const processedItems: ProductPriceInfo[] = rawSearchResults.map((result: DuckDuckGoSearchResult) => {
      let storeName = 'Không rõ';
      try {
        const urlObj = new URL(result.link);
        if (urlObj.hostname.includes('google.com') && urlObj.pathname.includes('/shopping')) {
            storeName = 'Google Shopping';
        } else {
            // Fallback if DuckDuckGo returns a direct link from within google.com/shopping search results
            storeName = urlObj.hostname.replace(/^www\./, '');
        }
      } catch (e) {
        console.warn(`[priceComparisonFlow] Invalid URL from search result: ${result.link}`);
      }
      return {
        productName: result.title,
        storeName: storeName,
        price: 0, // Price is not extracted without AI
        url: result.link,
        snippet: result.snippet,
      };
    });
    
    console.log(`[priceComparisonFlow] Processed ${processedItems.length} items from Google Shopping search results.`);
    return {
      items: processedItems,
      searchContext: `Kết quả tìm kiếm cho "${input.productIdentifier}" trên Google Shopping. Giá không được trích xuất tự động.`,
    };
  }
);

