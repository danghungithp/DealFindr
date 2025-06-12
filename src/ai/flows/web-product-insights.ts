
'use server';

/**
 * @fileOverview An AI agent that analyzes web search results for product insights.
 * This version is simplified to only perform targeted web searches (e.g., YouTube) and does NOT use AI for analysis.
 *
 * - fetchWebProductInsights - Fetches and analyzes web search results for a product identifier.
 * - WebProductInsightsInput - The input type for the fetchWebProductInsights function.
 * - WebProductInsightsOutput - The return type for the fetchWebProductInsights function.
 */

import {z} from 'genkit'; // Changed from 'import type {z}'
import {ai} from '@/ai/genkit'; // Import 'ai' for defineFlow, but not for AI analysis in this version
import { duckDuckGoSearchTool, type DuckDuckGoSearchOutput, type DuckDuckGoSearchResult } from '@/ai/tools/duckduckgo-search-tool';

const WebProductInsightsInputSchema = z.object({
  productIdentifier: z
    .string()
    .describe('Từ khóa tìm kiếm sản phẩm hoặc video sản phẩm.'),
});
export type WebProductInsightsInput = z.infer<typeof WebProductInsightsInputSchema>;

const ProductFindingSchema = z.object({
  productName: z.string().describe('Tiêu đề video hoặc tên sản phẩm từ kết quả tìm kiếm.'),
  storeName: z.string().describe('Nguồn (ví dụ: YouTube).'),
  price: z.number().default(0).describe('Giá sản phẩm. Mặc định là 0 do không có phân tích AI.'),
  url: z.string().url().describe('URL trực tiếp đến video hoặc trang sản phẩm.'),
  snippet: z.string().optional().describe('Mô tả ngắn từ kết quả tìm kiếm (nếu có).'),
});
export type ProductFinding = z.infer<typeof ProductFindingSchema>;

const WebProductInsightsOutputSchema = z.object({
  productFindings: z.array(ProductFindingSchema).describe('Danh sách các video hoặc sản phẩm tìm thấy từ các trang chỉ định.'),
  searchContext: z.string().describe("Thông tin về truy vấn tìm kiếm đã được thực hiện."),
  originalSearchQuery: z.string().describe('Từ khóa tìm kiếm gốc của người dùng.')
});
export type WebProductInsightsOutput = z.infer<typeof WebProductInsightsOutputSchema>;

export async function fetchWebProductInsights(input: WebProductInsightsInput): Promise<WebProductInsightsOutput> {
  return webProductInsightsFlow(input);
}

const TARGET_SEARCH_DOMAINS = ['youtube.com']; // Changed to YouTube

const webProductInsightsFlow = ai.defineFlow( // ai.defineFlow is still used to structure the server-side function
  {
    name: 'webProductInsightsFlow',
    inputSchema: WebProductInsightsInputSchema,
    outputSchema: WebProductInsightsOutputSchema,
  },
  async (input): Promise<WebProductInsightsOutput> => {
    try {
      console.log(`[webProductInsightsFlow] Received productIdentifier for YouTube search: ${input.productIdentifier}`);
      
      // Construct a more YouTube-friendly search query
      const searchQuery = `${input.productIdentifier} review OR ${input.productIdentifier} unboxing OR ${input.productIdentifier} đánh giá OR ${input.productIdentifier} trên tay`;

      const rawSearchResults: DuckDuckGoSearchOutput = await duckDuckGoSearchTool({ 
        query: searchQuery,
        domains: TARGET_SEARCH_DOMAINS, // Target YouTube
        // region: 'vn-vi' // Already set in the tool itself
      });

      console.log(`[webProductInsightsFlow] DuckDuckGo (targeted YouTube) returned ${rawSearchResults.length} results.`);
      
      if (rawSearchResults.length === 0) {
        return {
          productFindings: [],
          searchContext: `Không tìm thấy video nào trên YouTube cho "${input.productIdentifier}".`,
          originalSearchQuery: input.productIdentifier,
        };
      }

      // Transform search results into ProductFinding format
      const processedItems: ProductFinding[] = rawSearchResults.map((result: DuckDuckGoSearchResult) => {
        let storeName = 'YouTube'; // Default to YouTube
        try {
          const urlObj = new URL(result.link);
          // Ensure it's correctly identified as YouTube even if www is present
          if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
            storeName = 'YouTube';
          }
        } catch (e) {
          // console.warn(`[webProductInsightsFlow] Invalid URL from search result: ${result.link}`);
          // Keep storeName as 'YouTube' or default if URL is problematic
        }
        return {
          productName: result.title, // Video title
          storeName: storeName,
          price: 0, // No AI analysis for price, not applicable for YouTube videos
          url: result.link, // Video URL
          snippet: result.snippet, // Video description snippet
        };
      });
      
      console.log(`[webProductInsightsFlow] Processed ${processedItems.length} items from YouTube search.`);
      return {
        productFindings: processedItems,
        searchContext: `Kết quả tìm kiếm video trên YouTube cho "${input.productIdentifier}".`,
        originalSearchQuery: input.productIdentifier,
      };

    } catch (error) {
      console.error('[webProductInsightsFlow] Critical error in flow execution:', error);
      let errorMessage = "Đã xảy ra lỗi nghiêm trọng trong quá trình xử lý.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      // Return a structured error response that matches the output schema
      return {
        productFindings: [],
        searchContext: `Lỗi hệ thống khi tìm kiếm trên YouTube: ${errorMessage}`,
        originalSearchQuery: input.productIdentifier, // Include original query even on error
      };
    }
  }
);
