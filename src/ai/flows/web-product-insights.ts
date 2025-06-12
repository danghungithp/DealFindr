
'use server';

/**
 * @fileOverview An AI agent that analyzes web search results for product insights.
 *
 * - fetchWebProductInsights - Fetches and analyzes web search results for a product identifier.
 * - WebProductInsightsInput - The input type for the fetchWebProductInsights function.
 * - WebProductInsightsOutput - The return type for the fetchWebProductInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { duckDuckGoSearchTool, type DuckDuckGoSearchOutput, type DuckDuckGoSearchResult, DuckDuckGoSearchOutputSchema } from '@/ai/tools/duckduckgo-search-tool';

const WebProductInsightsInputSchema = z.object({
  productIdentifier: z
    .string()
    .describe('Từ khóa tìm kiếm sản phẩm hoặc URL sản phẩm.'),
});
export type WebProductInsightsInput = z.infer<typeof WebProductInsightsInputSchema>;

const KeySourceSchema = z.object({
  title: z.string().describe('Tiêu đề của nguồn thông tin.'),
  url: z.string().url().describe('URL của nguồn thông tin.'),
  snippet: z.string().optional().describe('Mô tả ngắn của nguồn thông tin.'),
});

const ProductFindingSchema = z.object({
  title: z.string().describe('Tiêu đề của sản phẩm/trang được tìm thấy.'),
  url: z.string().url().describe('URL của sản phẩm/trang.'),
  snippet: z.string().optional().describe('Mô tả ngắn của sản phẩm/trang.'),
  extractedPrice: z.string().optional().describe('Giá ước tính AI trích xuất được từ snippet hoặc tiêu đề (ví dụ: "1.200.000 đ", "Liên hệ", "Từ 500k"). Nếu không tìm thấy, để trống.'),
  storeName: z.string().optional().describe('Tên cửa hàng/website được suy ra từ URL (ví dụ: Shopee, Lazada, Tiki, hoặc tên miền khác).'),
});

const WebProductInsightsOutputInternalSchema = z.object({
  analyzedProductName: z.string().describe('Tên sản phẩm chính được AI xác định từ kết quả tìm kiếm và từ khóa.'),
  overallSummary: z.string().describe('Tóm tắt chung về sản phẩm dựa trên các kết quả tìm kiếm từ web, bằng tiếng Việt.'),
  positiveMentions: z.array(z.string()).describe('Danh sách các điểm tích cực hoặc đánh giá tốt được tìm thấy, bằng tiếng Việt.'),
  negativeMentions: z.array(z.string()).describe('Danh sách các điểm tiêu cực hoặc quan ngại được tìm thấy, bằng tiếng Việt.'),
  discountMentions: z.array(z.string()).describe('Danh sách các đề cập về mã giảm giá hoặc khuyến mãi tìm thấy từ web (mang tính tham khảo), bằng tiếng Việt.'),
  keySources: z.array(KeySourceSchema).describe('Một vài nguồn tin chính từ kết quả tìm kiếm mà AI cho là quan trọng.'),
  productFindings: z.array(ProductFindingSchema).describe('Danh sách các sản phẩm cụ thể tìm thấy với giá ước tính (tối đa 5-7 mục).'),
});


const WebProductInsightsOutputSchema = WebProductInsightsOutputInternalSchema.extend({
  originalSearchQuery: z.string().describe('Từ khóa tìm kiếm gốc của người dùng.')
});
export type WebProductInsightsOutput = z.infer<typeof WebProductInsightsOutputSchema>;

export async function fetchWebProductInsights(input: WebProductInsightsInput): Promise<WebProductInsightsOutput> {
  return webProductInsightsFlow(input);
}

const analyzeWebResultsPrompt = ai.definePrompt({
  name: 'analyzeWebResultsPrompt',
  input: { schema: z.object({ productIdentifier: z.string(), searchResults: DuckDuckGoSearchOutputSchema }) },
  output: { schema: WebProductInsightsOutputInternalSchema },
  prompt: `Bạn là một trợ lý nghiên cứu thị trường AI. Nhiệm vụ của bạn là phân tích kết quả tìm kiếm trên web được cung cấp để tìm hiểu thông tin về một sản phẩm hoặc chủ đề.

Từ khóa tìm kiếm gốc: {{{productIdentifier}}}

Kết quả tìm kiếm từ DuckDuckGo:
{{#if searchResults.length}}
  {{#each searchResults}}
  - Tiêu đề: {{{this.title}}}
    Link: {{{this.link}}}
    Mô tả ngắn: {{{this.snippet}}}
  {{/each}}
{{else}}
  Không có kết quả tìm kiếm nào được cung cấp.
{{/if}}

Dựa vào từ khóa tìm kiếm gốc và các kết quả tìm kiếm ở trên, hãy thực hiện các yêu cầu sau (TOÀN BỘ PHẢN HỒI PHẢI BẰNG TIẾNG VIỆT):

1.  **analyzedProductName**: Xác định và nêu tên sản phẩm hoặc chủ đề chính đang được nói đến.
2.  **overallSummary**: Viết một đoạn tóm tắt chung (dưới 150 từ) về những gì bạn tìm hiểu được về sản phẩm/chủ đề này từ các kết quả tìm kiếm.
3.  **positiveMentions**: Liệt kê 3-5 điểm tích cực, ưu điểm, hoặc nhận xét tốt về sản phẩm/chủ đề. Mỗi điểm là một câu ngắn gọn.
4.  **negativeMentions**: Liệt kê 3-5 điểm tiêu cực, nhược điểm, hoặc mối quan ngại về sản phẩm/chủ đề. Mỗi điểm là một câu ngắn gọn.
5.  **discountMentions**: Nếu có bất kỳ đề cập nào về mã giảm giá, chương trình khuyến mãi, hoặc ưu đãi đặc biệt trong các mô tả ngắn, hãy liệt kê chúng. Lưu ý rằng đây chỉ là những đề cập tìm thấy, không đảm bảo tính chính xác hay hiệu lực. Nếu không thấy, ghi rõ "Không tìm thấy đề cập mã giảm giá nào."
6.  **keySources**: Chọn ra 2-3 kết quả tìm kiếm quan trọng nhất và nhiều thông tin nhất cho mục đích tham khảo chung. Với mỗi nguồn, cung cấp lại tiêu đề, URL và mô tả ngắn của nó.
7.  **productFindings**: Từ các kết quả tìm kiếm, chọn ra tối đa 5-7 mục mà bạn cho là trang sản phẩm hoặc có khả năng chứa thông tin giá. Với mỗi mục này:
    *   Lấy title, url, snippet từ kết quả tìm kiếm tương ứng.
    *   **extractedPrice**: Cố gắng trích xuất giá từ title hoặc snippet. Giá này có thể là một con số cụ thể (ví dụ: "1.200.000 đ"), một khoảng giá (ví dụ: "1tr - 2tr"), hoặc một thông báo (ví dụ: "Liên hệ", "Giá tốt"). Nếu không tìm thấy giá hoặc không chắc chắn, để trống trường này hoặc ghi "Chưa rõ".
    *   **storeName**: Suy ra tên cửa hàng từ url (ví dụ: "shopee.vn" -> "Shopee", "lazada.vn" -> "Lazada", "tiki.vn" -> "Tiki"). Nếu không phải trang TMĐT phổ biến, có thể dùng tên miền chính (ví dụ: "dienmayxanh.com").
    *   Đảm bảo title, url là của trang sản phẩm đó.

Nếu không có kết quả tìm kiếm nào được cung cấp hoặc không thể phân tích, hãy trả về các trường văn bản với nội dung phù hợp để thông báo điều này.
Ví dụ: analyzedProductName: "Không xác định", overallSummary: "Không có đủ thông tin để phân tích từ kết quả tìm kiếm." , positiveMentions: [], negativeMentions: [], discountMentions: ["Không tìm thấy đề cập mã giảm giá nào."], keySources: [], productFindings: [].
`,
});

const webProductInsightsFlow = ai.defineFlow(
  {
    name: 'webProductInsightsFlow',
    inputSchema: WebProductInsightsInputSchema,
    outputSchema: WebProductInsightsOutputSchema,
  },
  async (input): Promise<WebProductInsightsOutput> => {
    try {
      console.log(`[webProductInsightsFlow] Received productIdentifier for web search: ${input.productIdentifier}`);
      
      const rawSearchResults: DuckDuckGoSearchOutput = await duckDuckGoSearchTool({ 
        query: input.productIdentifier 
      });

      console.log(`[webProductInsightsFlow] DuckDuckGo returned ${rawSearchResults.length} results.`);
      if (rawSearchResults.length > 0) {
          rawSearchResults.forEach((r, i) => console.log(`[webProductInsightsFlow] Result ${i}: ${r.title} - ${r.link}`));
      } else {
        console.log('[webProductInsightsFlow] No results from DuckDuckGo.');
        return {
          analyzedProductName: "Không xác định",
          overallSummary: `Không tìm thấy kết quả nào từ web cho tìm kiếm "${input.productIdentifier}".`,
          positiveMentions: [],
          negativeMentions: [],
          discountMentions: [],
          keySources: [],
          productFindings: [],
          originalSearchQuery: input.productIdentifier,
        };
      }

      const {output: rawAiOutput} = await analyzeWebResultsPrompt({
        productIdentifier: input.productIdentifier,
        searchResults: rawSearchResults
      });
      
      if (!rawAiOutput) {
        console.warn('[webProductInsightsFlow] AI analysis returned no output (null or undefined).');
        return {
          analyzedProductName: "Không xác định",
          overallSummary: "AI không thể phân tích kết quả tìm kiếm (không có output).",
          positiveMentions: [],
          negativeMentions: [],
          discountMentions: [],
          keySources: [],
          productFindings: [],
          originalSearchQuery: input.productIdentifier,
        };
      }

      // Explicitly parse AI output to catch schema mismatches
      const parsedAiOutput = WebProductInsightsOutputInternalSchema.safeParse(rawAiOutput);

      if (!parsedAiOutput.success) {
        console.error('[webProductInsightsFlow] AI output failed Zod validation:', parsedAiOutput.error.flatten());
        return {
          analyzedProductName: "Lỗi định dạng",
          overallSummary: "Output từ AI không đúng định dạng mong muốn. Vui lòng kiểm tra logs.",
          positiveMentions: [],
          negativeMentions: [],
          discountMentions: [],
          keySources: [],
          productFindings: [],
          originalSearchQuery: input.productIdentifier,
        };
      }
      
      console.log('[webProductInsightsFlow] AI analysis successful and validated. Product findings count:', parsedAiOutput.data.productFindings?.length);
      return { ...parsedAiOutput.data, originalSearchQuery: input.productIdentifier };

    } catch (error) {
      console.error('[webProductInsightsFlow] Critical error in flow execution:', error);
      let errorMessage = "Đã xảy ra lỗi nghiêm trọng trong quá trình xử lý.";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      return {
        analyzedProductName: "Lỗi nghiêm trọng",
        overallSummary: `Lỗi hệ thống: ${errorMessage}`,
        positiveMentions: [],
        negativeMentions: [],
        discountMentions: [],
        keySources: [],
        productFindings: [],
        originalSearchQuery: input.productIdentifier,
      };
    }
  }
);
