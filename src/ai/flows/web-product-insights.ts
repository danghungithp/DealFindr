
'use server';

/**
 * @fileOverview An AI agent that analyzes web search results for comprehensive product insights,
 * including product listings with AI-extracted prices and related YouTube videos.
 *
 * - fetchWebProductInsights - Fetches and analyzes web search results.
 * - WebProductInsightsInput - The input type.
 * - WebProductInsightsOutput - The return type.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { duckDuckGoSearchTool, type DuckDuckGoSearchOutput, type DuckDuckGoSearchResult, DuckDuckGoSearchOutputSchema } from '@/ai/tools/duckduckgo-search-tool';

// Define Schemas

const ProductFindingSchema = z.object({
  title: z.string().describe('Tên sản phẩm hoặc tiêu đề trang web/video.'),
  url: z.string().url().describe('URL trực tiếp đến trang sản phẩm hoặc video.'),
  snippet: z.string().optional().describe('Mô tả ngắn từ kết quả tìm kiếm hoặc video.'),
  extractedPrice: z.string().optional().describe('Giá ước tính được AI trích xuất (ví dụ: "1.200.000 đ", "Liên hệ", "Không rõ").'),
  storeName: z.string().optional().describe('Tên cửa hàng được AI suy luận (ví dụ: Shopee, Lazada, Tiki) hoặc nguồn (YouTube).'),
});
export type ProductFinding = z.infer<typeof ProductFindingSchema>; // Export type for component

const VideoFindingSchema = z.object({
  title: z.string().describe('Tiêu đề video.'),
  url: z.string().url().describe('URL trực tiếp đến video YouTube.'),
  snippet: z.string().optional().describe('Mô tả ngắn của video.'),
});
export type VideoFinding = z.infer<typeof VideoFindingSchema>; // Export type for component


const WebProductInsightsInputSchema = z.object({
  productIdentifier: z
    .string()
    .describe('Từ khóa tìm kiếm sản phẩm.'),
});
// Export type for page.tsx
export type WebProductInsightsInput = z.infer<typeof WebProductInsightsInputSchema>;


const AIAnalysisOutputSchema = z.object({
  analyzedProductName: z.string().optional().describe('Tên sản phẩm chính mà AI phân tích được từ kết quả tìm kiếm web, ví dụ: "iPhone 13 Pro Max".'),
  overallSummary: z.string().optional().describe('Tóm tắt chung (1-2 câu) về sản phẩm hoặc các thông tin nổi bật tìm thấy từ web, bằng tiếng Việt.'),
  productFindings: z.array(ProductFindingSchema).describe('Danh sách các sản phẩm hoặc trang giá tìm thấy từ kết quả tìm kiếm web. Tối đa 5 mục.'),
});


const WebProductInsightsOutputSchema = z.object({
  analyzedProductName: z.string().optional().describe('Tên sản phẩm chính mà AI phân tích được.'),
  overallSummary: z.string().optional().describe('Tóm tắt chung về sản phẩm dựa trên các kết quả web.'),
  productFindings: z.array(ProductFindingSchema).describe('Danh sách các sản phẩm/trang giá tìm thấy trên web.'),
  videoFindings: z.array(VideoFindingSchema).describe('Danh sách các video liên quan tìm thấy trên YouTube.'),
  searchContext: z.string().describe("Thông tin về các truy vấn tìm kiếm đã được thực hiện."),
  originalSearchQuery: z.string().describe('Từ khóa tìm kiếm gốc của người dùng.')
});
// Export type for page.tsx
export type WebProductInsightsOutput = z.infer<typeof WebProductInsightsOutputSchema>;


// Main exported function
export async function fetchWebProductInsights(input: WebProductInsightsInput): Promise<WebProductInsightsOutput> {
  return webProductInsightsFlow(input);
}

// AI Prompt for Web Product Analysis
const analyzeProductWebResultsPrompt = ai.definePrompt({
  name: 'analyzeProductWebResultsPrompt',
  input: { schema: z.object({ productIdentifier: z.string(), searchResults: DuckDuckGoSearchOutputSchema }) },
  output: { schema: AIAnalysisOutputSchema },
  prompt: `Bạn là một chuyên gia phân tích sản phẩm e-commerce. Nhiệm vụ của bạn là phân tích kết quả tìm kiếm từ DuckDuckGo cho một sản phẩm cụ thể và trích xuất thông tin hữu ích.
Người dùng đang tìm kiếm: "{{productIdentifier}}"
Dưới đây là kết quả tìm kiếm (từ các trang như Shopee, Lazada, Tiki, hoặc web nói chung):
{{#each searchResults}}
- Tiêu đề: {{{this.title}}}
  Link: {{{this.link}}}
  Mô tả: {{{this.snippet}}}
{{/each}}

Dựa vào thông tin trên, hãy cung cấp:
1.  analyzedProductName: Tên sản phẩm đầy đủ và chính xác nhất mà bạn xác định được người dùng đang tìm. Nếu không chắc, hãy dựa trên productIdentifier.
2.  overallSummary: Một bản tóm tắt rất ngắn gọn (1-2 câu) về những gì bạn tìm thấy liên quan đến sản phẩm này từ các kết quả trên. Ví dụ: "iPhone 13 có nhiều lựa chọn từ các nhà bán lẻ với giá dao động." hoặc "Có vẻ đây là một sản phẩm mới, thông tin còn hạn chế."
3.  productFindings: Trích xuất tối đa 5 trang sản phẩm hoặc trang cung cấp thông tin giá tiềm năng nhất từ danh sách kết quả. Với mỗi trang:
    *   title: Giữ nguyên tiêu đề từ kết quả tìm kiếm.
    *   url: Giữ nguyên URL.
    *   snippet: Giữ nguyên mô tả ngắn.
    *   extractedPrice: Cố gắng trích xuất giá từ tiêu đề hoặc mô tả. Giá có thể là một con số cụ thể (ví dụ: "1.200.000 đ"), một khoảng giá (ví dụ: "1tr - 2tr"), hoặc một thông báo (ví dụ: "Liên hệ", "Giá tốt"). Nếu không tìm thấy giá hoặc không chắc chắn, hãy ghi "Không rõ".
    *   storeName: Suy ra tên cửa hàng từ URL (ví dụ: "shopee.vn" -> "Shopee", "lazada.vn" -> "Lazada", "tiki.vn" -> "Tiki", "dienmayxanh.com" -> "Điện Máy Xanh"). Nếu là trang web chung không phải cửa hàng, có thể để trống hoặc ghi tên miền chính.

Quan trọng:
- Chỉ tập trung vào các kết quả có vẻ là trang sản phẩm, trang danh mục hoặc bài viết có giá.
- Đảm bảo tất cả văn bản trả về bằng tiếng Việt.
- Nếu không có kết quả tìm kiếm nào được cung cấp, hãy trả về các trường trống hoặc một thông báo phù hợp trong summary.
`,
});


// Genkit Flow
const webProductInsightsFlow = ai.defineFlow(
  {
    name: 'webProductInsightsFlow',
    inputSchema: WebProductInsightsInputSchema,
    outputSchema: WebProductInsightsOutputSchema,
  },
  async (input): Promise<WebProductInsightsOutput> => {
    let aiAnalysis: AIAnalysisOutput = { productFindings: [], analyzedProductName: input.productIdentifier, overallSummary: "Không có thông tin phân tích." };
    let videoResults: VideoFinding[] = [];
    let searchContextMessage = "";

    const ECOMMERCE_DOMAINS = ['shopee.vn', 'lazada.vn', 'tiki.vn', 'nguyenkim.com', 'dienmayxanh.com', 'fptshop.com.vn', 'cellphones.com.vn'];
    const YOUTUBE_DOMAIN = ['youtube.com'];

    try {
      // 1. Search for products on e-commerce and general web
      const generalWebSearchQuery = input.productIdentifier;
      const generalWebSearchResults: DuckDuckGoSearchOutput = await duckDuckGoSearchTool({
        query: generalWebSearchQuery,
        domains: ECOMMERCE_DOMAINS, // Focus on e-commerce, but DDG might return general web too
      });

      searchContextMessage = `Kết quả dựa trên tìm kiếm cho "${input.productIdentifier}".\n`;

      if (generalWebSearchResults && generalWebSearchResults.length > 0) {
        searchContextMessage += `Đã tìm thấy ${generalWebSearchResults.length} kết quả từ web để phân tích. `;
        // Use safeParse to validate AI output against a temporary schema excluding originalSearchQuery
        const aiAnalysisInput = {
            productIdentifier: input.productIdentifier,
            searchResults: generalWebSearchResults,
        };
        const { output: rawAiOutput } = await analyzeProductWebResultsPrompt(aiAnalysisInput);

        if (rawAiOutput) {
            const validatedAIOutput = AIAnalysisOutputSchema.safeParse(rawAiOutput);
            if (validatedAIOutput.success) {
                aiAnalysis = validatedAIOutput.data;
            } else {
                console.error('[webProductInsightsFlow] AI output failed Zod validation:', validatedAIOutput.error);
                aiAnalysis.overallSummary = "AI đã trả về dữ liệu không hợp lệ. Không thể hiển thị phân tích chi tiết.";
            }
        } else {
           aiAnalysis.overallSummary = "AI không thể phân tích kết quả tìm kiếm web.";
        }
      } else {
        searchContextMessage += "Không tìm thấy kết quả web nào để phân tích giá. ";
        aiAnalysis.overallSummary = `Không tìm thấy kết quả web nào phù hợp để phân tích cho "${input.productIdentifier}".`;
      }

      // 2. Search for YouTube videos
      const videoSearchQuery = `${input.productIdentifier} review OR ${input.productIdentifier} trên tay OR ${input.productIdentifier} đánh giá`;
      const youtubeSearchResults: DuckDuckGoSearchOutput = await duckDuckGoSearchTool({
        query: videoSearchQuery,
        domains: YOUTUBE_DOMAIN,
      });

      if (youtubeSearchResults && youtubeSearchResults.length > 0) {
        searchContextMessage += `Tìm thấy ${youtubeSearchResults.length} video trên YouTube.`;
        videoResults = youtubeSearchResults.map(result => ({
          title: result.title,
          url: result.link,
          snippet: result.snippet,
        }));
      } else {
        searchContextMessage += "Không tìm thấy video nào trên YouTube.";
      }
      
      if (generalWebSearchResults.length === 0 && youtubeSearchResults.length === 0) {
        aiAnalysis.overallSummary = `Không tìm thấy thông tin sản phẩm hay video nào cho "${input.productIdentifier}" từ web và YouTube.`;
      }


      return {
        analyzedProductName: aiAnalysis.analyzedProductName || input.productIdentifier,
        overallSummary: aiAnalysis.overallSummary,
        productFindings: aiAnalysis.productFindings || [],
        videoFindings: videoResults,
        searchContext: searchContextMessage.trim(),
        originalSearchQuery: input.productIdentifier,
      };

    } catch (error) {
      console.error('[webProductInsightsFlow] Critical error in flow execution:', error);
      let errorMessage = "Đã xảy ra lỗi nghiêm trọng trong quá trình xử lý.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return {
        analyzedProductName: input.productIdentifier,
        overallSummary: `Lỗi hệ thống: ${errorMessage}`,
        productFindings: [],
        videoFindings: [],
        searchContext: `Đã xảy ra lỗi khi tìm kiếm cho "${input.productIdentifier}".`,
        originalSearchQuery: input.productIdentifier,
      };
    }
  }
);

    

    