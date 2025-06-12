
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

const WebProductInsightsOutputSchema = z.object({
  analyzedProductName: z.string().describe('Tên sản phẩm chính được AI xác định từ kết quả tìm kiếm và từ khóa.'),
  overallSummary: z.string().describe('Tóm tắt chung về sản phẩm dựa trên các kết quả tìm kiếm từ web, bằng tiếng Việt.'),
  positiveMentions: z.array(z.string()).describe('Danh sách các điểm tích cực hoặc đánh giá tốt được tìm thấy, bằng tiếng Việt.'),
  negativeMentions: z.array(z.string()).describe('Danh sách các điểm tiêu cực hoặc quan ngại được tìm thấy, bằng tiếng Việt.'),
  discountMentions: z.array(z.string()).describe('Danh sách các đề cập về mã giảm giá hoặc khuyến mãi tìm thấy từ web (mang tính tham khảo), bằng tiếng Việt.'),
  keySources: z.array(KeySourceSchema).describe('Một vài nguồn tin chính từ kết quả tìm kiếm mà AI cho là quan trọng.'),
  originalSearchQuery: z.string().describe('Từ khóa tìm kiếm gốc của người dùng.')
});
export type WebProductInsightsOutput = z.infer<typeof WebProductInsightsOutputSchema>;

export async function fetchWebProductInsights(input: WebProductInsightsInput): Promise<WebProductInsightsOutput> {
  return webProductInsightsFlow(input);
}

const analyzeWebResultsPrompt = ai.definePrompt({
  name: 'analyzeWebResultsPrompt',
  input: { schema: z.object({ productIdentifier: z.string(), searchResults: DuckDuckGoSearchOutputSchema }) },
  output: { schema: WebProductInsightsOutputSchema.omit({ originalSearchQuery: true }) }, // originalSearchQuery is added back in the flow
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
6.  **keySources**: Chọn ra 2-3 kết quả tìm kiếm quan trọng nhất và nhiều thông tin nhất. Với mỗi nguồn, cung cấp lại tiêu đề, URL và mô tả ngắn của nó.

Nếu không có kết quả tìm kiếm nào được cung cấp hoặc không thể phân tích, hãy trả về các trường văn bản với nội dung phù hợp để thông báo điều này.
Ví dụ: analyzedProductName: "Không xác định", overallSummary: "Không có đủ thông tin để phân tích từ kết quả tìm kiếm." , positiveMentions: [], negativeMentions: [], discountMentions: ["Không tìm thấy đề cập mã giảm giá nào."], keySources: [].
`,
});

const webProductInsightsFlow = ai.defineFlow(
  {
    name: 'webProductInsightsFlow',
    inputSchema: WebProductInsightsInputSchema,
    outputSchema: WebProductInsightsOutputSchema,
  },
  async (input): Promise<WebProductInsightsOutput> => {
    console.log(`[webProductInsightsFlow] Received productIdentifier for web search: ${input.productIdentifier}`);
    
    // Step 1: Perform DuckDuckGo search (no domain restrictions)
    const rawSearchResults: DuckDuckGoSearchOutput = await duckDuckGoSearchTool({ 
      query: input.productIdentifier 
    });

    console.log(`[webProductInsightsFlow] DuckDuckGo returned ${rawSearchResults.length} results.`);
    if (rawSearchResults.length > 0) {
        rawSearchResults.forEach((r, i) => console.log(`Result ${i}: ${r.title} - ${r.link}`));
    }


    // Step 2: Pass search results to AI for analysis
    try {
      const {output} = await analyzeWebResultsPrompt({
        productIdentifier: input.productIdentifier,
        searchResults: rawSearchResults
      });
      
      if (!output) {
        console.warn('[webProductInsightsFlow] AI analysis returned no output.');
        return {
          analyzedProductName: "Không xác định",
          overallSummary: "AI không thể phân tích kết quả tìm kiếm.",
          positiveMentions: [],
          negativeMentions: [],
          discountMentions: ["Không tìm thấy đề cập mã giảm giá nào."],
          keySources: [],
          originalSearchQuery: input.productIdentifier,
        };
      }
      console.log('[webProductInsightsFlow] AI analysis successful.');
      return { ...output, originalSearchQuery: input.productIdentifier };

    } catch (error) {
      console.error('[webProductInsightsFlow] Error during AI analysis:', error);
      return {
        analyzedProductName: "Lỗi phân tích",
        overallSummary: "Đã xảy ra lỗi trong quá trình AI phân tích kết quả tìm kiếm.",
        positiveMentions: [],
        negativeMentions: [],
        discountMentions: [],
        keySources: [],
        originalSearchQuery: input.productIdentifier,
      };
    }
  }
);
