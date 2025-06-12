
'use server';

/**
 * @fileOverview A product listing utility using DuckDuckGo search.
 *
 * - priceComparison - A function that lists products for a search keyword
 *   from the web using DuckDuckGo.
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
  storeName: z.string().describe('Tên cửa hàng/website (ví dụ: Shopee, Lazada, Tiki, hoặc tên miền khác).'),
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

const priceComparisonFlow = ai.defineFlow(
  {
    name: 'priceComparisonFlow',
    inputSchema: PriceComparisonInputSchema,
    outputSchema: PriceComparisonOutputSchema,
  },
  async (input): Promise<PriceComparisonOutput> => {
    console.log(`[priceComparisonFlow] Received productIdentifier for web search: ${input.productIdentifier}`);
    
    // Call DuckDuckGo search without domain restrictions
    const rawSearchResults: DuckDuckGoSearchOutput = await duckDuckGoSearchTool({ 
      query: input.productIdentifier 
    });

    console.log(`[priceComparisonFlow] DuckDuckGo returned ${rawSearchResults.length} results from web search.`);

    if (rawSearchResults.length === 0) {
      return {
        items: [],
        searchContext: `Không tìm thấy kết quả nào cho "${input.productIdentifier}" trên web.`,
      };
    }
    
    const processedItems: ProductPriceInfo[] = rawSearchResults.map((result: DuckDuckGoSearchResult) => {
      let storeName = 'Không rõ';
      try {
        const urlObj = new URL(result.link);
        const hostname = urlObj.hostname.toLowerCase();
        // Basic store name inference, can be expanded
        if (hostname.includes('shopee.vn')) {
            storeName = 'Shopee';
        } else if (hostname.includes('lazada.vn')) {
            storeName = 'Lazada';
        } else if (hostname.includes('tiki.vn')) {
            storeName = 'Tiki';
        } else {
            storeName = urlObj.hostname.replace(/^www\./, ''); // Use hostname if not a known e-commerce site
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
    
    console.log(`[priceComparisonFlow] Processed ${processedItems.length} items from web search results.`);
    return {
      items: processedItems,
      searchContext: `Kết quả tìm kiếm trên web cho "${input.productIdentifier}". Giá không được trích xuất tự động.`,
    };
  }
);
