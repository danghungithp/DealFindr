
'use server';

/**
 * @fileOverview A product listing utility using DuckDuckGo search.
 *
 * - priceComparison - A function that lists products for a search keyword
 *   from Shopee, Lazada, and Tiki using DuckDuckGo.
 * - PriceComparisonInput - The input type for the priceComparison function.
 * - PriceComparisonOutput - The return type for the priceComparison function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { duckDuckGoSearchTool, type DuckDuckGoSearchOutput, type DuckDuckGoSearchResult } from '@/ai/tools/duckduckgo-search-tool';

const PriceComparisonInputSchema = z.object({
  productIdentifier: z
    .string()
    .describe('Từ khóa tìm kiếm sản phẩm.'),
});
export type PriceComparisonInput = z.infer<typeof PriceComparisonInputSchema>;

const ProductPriceInfoSchema = z.object({
  productName: z.string().describe('Tên sản phẩm từ kết quả tìm kiếm.'),
  storeName: z.string().describe('Tên cửa hàng/website (ví dụ: Shopee, Lazada, Tiki).'),
  price: z.number().default(0).describe('Giá sản phẩm. Mặc định là 0 do không có phân tích AI.'),
  url: z.string().url().describe('URL trực tiếp đến trang sản phẩm.'),
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

const TARGET_ECOMMERCE_DOMAINS = ['shopee.vn', 'lazada.vn', 'tiki.vn'];

const priceComparisonFlow = ai.defineFlow(
  {
    name: 'priceComparisonFlow',
    inputSchema: PriceComparisonInputSchema,
    outputSchema: PriceComparisonOutputSchema,
  },
  async (input): Promise<PriceComparisonOutput> => {
    console.log(`[priceComparisonFlow] Received productIdentifier: ${input.productIdentifier}`);
    
    const rawSearchResults: DuckDuckGoSearchOutput = await duckDuckGoSearchTool({ 
      query: input.productIdentifier,
      domains: TARGET_ECOMMERCE_DOMAINS 
    });

    console.log(`[priceComparisonFlow] DuckDuckGo returned ${rawSearchResults.length} results.`);

    if (rawSearchResults.length === 0) {
      return {
        items: [],
        searchContext: `Không tìm thấy kết quả nào cho "${input.productIdentifier}" trên Shopee, Lazada, Tiki.`,
      };
    }
    
    const processedItems: ProductPriceInfo[] = rawSearchResults.map(result => {
      let storeName = 'Không rõ';
      try {
        const urlObj = new URL(result.link);
        if (urlObj.hostname.includes('shopee.vn')) storeName = 'Shopee';
        else if (urlObj.hostname.includes('lazada.vn')) storeName = 'Lazada';
        else if (urlObj.hostname.includes('tiki.vn')) storeName = 'Tiki';
        else storeName = urlObj.hostname.replace(/^www\./, '');
      } catch (e) {
        // ignore if URL is invalid, though DuckDuckGo should return valid URLs
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
    
    console.log(`[priceComparisonFlow] Processed ${processedItems.length} items from search results.`);
    return {
      items: processedItems,
      searchContext: `Kết quả tìm kiếm cho "${input.productIdentifier}" trên Shopee, Lazada, Tiki. Giá không được trích xuất tự động.`,
    };
  }
);
