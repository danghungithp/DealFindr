
'use server';

/**
 * @fileOverview An AI agent that analyzes web search results for product insights.
 * This version is simplified to only perform targeted web searches and does NOT use AI for analysis.
 *
 * - fetchWebProductInsights - Fetches and analyzes web search results for a product identifier.
 * - WebProductInsightsInput - The input type for the fetchWebProductInsights function.
 * - WebProductInsightsOutput - The return type for the fetchWebProductInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { duckDuckGoSearchTool, type DuckDuckGoSearchOutput, type DuckDuckGoSearchResult } from '@/ai/tools/duckduckgo-search-tool';

const WebProductInsightsInputSchema = z.object({
  productIdentifier: z
    .string()
    .describe('Từ khóa tìm kiếm sản phẩm hoặc URL sản phẩm.'),
});
export type WebProductInsightsInput = z.infer<typeof WebProductInsightsInputSchema>;

const ProductFindingSchema = z.object({
  productName: z.string().describe('Tên sản phẩm từ kết quả tìm kiếm.'),
  storeName: z.string().describe('Tên cửa hàng/website (ví dụ: Shopee, Lazada, Tiki, TikTok hoặc tên miền khác).'),
  price: z.number().default(0).describe('Giá sản phẩm. Mặc định là 0 do không có phân tích AI.'),
  url: z.string().url().describe('URL trực tiếp đến trang sản phẩm hoặc kết quả tìm kiếm.'),
  snippet: z.string().optional().describe('Mô tả ngắn từ kết quả tìm kiếm (nếu có).'),
});
export type ProductFinding = z.infer<typeof ProductFindingSchema>;

const WebProductInsightsOutputSchema = z.object({
  productFindings: z.array(ProductFindingSchema).describe('Danh sách các sản phẩm tìm thấy từ các trang chỉ định.'),
  searchContext: z.string().describe("Thông tin về truy vấn tìm kiếm đã được thực hiện."),
  originalSearchQuery: z.string().describe('Từ khóa tìm kiếm gốc của người dùng.')
});
export type WebProductInsightsOutput = z.infer<typeof WebProductInsightsOutputSchema>;

export async function fetchWebProductInsights(input: WebProductInsightsInput): Promise<WebProductInsightsOutput> {
  return webProductInsightsFlow(input);
}

const TARGET_ECOMMERCE_DOMAINS = ['lazada.vn', 'tiki.vn', 'shopee.vn', 'tiktok.com'];

const webProductInsightsFlow = ai.defineFlow(
  {
    name: 'webProductInsightsFlow',
    inputSchema: WebProductInsightsInputSchema,
    outputSchema: WebProductInsightsOutputSchema,
  },
  async (input): Promise<WebProductInsightsOutput> => {
    try {
      console.log(`[webProductInsightsFlow] Received productIdentifier for targeted web search: ${input.productIdentifier}`);
      
      const rawSearchResults: DuckDuckGoSearchOutput = await duckDuckGoSearchTool({ 
        query: input.productIdentifier,
        domains: TARGET_ECOMMERCE_DOMAINS,
      });

      console.log(`[webProductInsightsFlow] DuckDuckGo (targeted) returned ${rawSearchResults.length} results.`);
      
      if (rawSearchResults.length === 0) {
        return {
          productFindings: [],
          searchContext: `Không tìm thấy kết quả nào trên ${TARGET_ECOMMERCE_DOMAINS.join(', ')} cho "${input.productIdentifier}".`,
          originalSearchQuery: input.productIdentifier,
        };
      }

      const processedItems: ProductFinding[] = rawSearchResults.map((result: DuckDuckGoSearchResult) => {
        let storeName = 'Không rõ';
        try {
          const urlObj = new URL(result.link);
          storeName = urlObj.hostname.replace(/^www\./, '');
          if (storeName === 'google.com' && result.link.includes('/shopping')) {
            storeName = 'Google Shopping';
          } else if (storeName.includes('tiktok.com')){
             storeName = 'TikTok Shop';
          }
        } catch (e) {
          console.warn(`[webProductInsightsFlow] Invalid URL from search result: ${result.link}`);
        }
        return {
          productName: result.title,
          storeName: storeName,
          price: 0, // No AI analysis for price
          url: result.link,
          snippet: result.snippet,
        };
      });
      
      console.log(`[webProductInsightsFlow] Processed ${processedItems.length} items from targeted web search.`);
      return {
        productFindings: processedItems,
        searchContext: `Kết quả tìm kiếm trên ${TARGET_ECOMMERCE_DOMAINS.join(', ')} cho "${input.productIdentifier}". Giá không được trích xuất.`,
        originalSearchQuery: input.productIdentifier,
      };

    } catch (error) {
      console.error('[webProductInsightsFlow] Critical error in flow execution:', error);
      let errorMessage = "Đã xảy ra lỗi nghiêm trọng trong quá trình xử lý.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return {
        productFindings: [],
        searchContext: `Lỗi hệ thống khi tìm kiếm trên ${TARGET_ECOMMERCE_DOMAINS.join(', ')}: ${errorMessage}`,
        originalSearchQuery: input.productIdentifier,
      };
    }
  }
);
