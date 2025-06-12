
'use server';

/**
 * @fileOverview A product listing and price analysis utility using DuckDuckGo search and AI.
 *
 * - priceComparison - A function that lists products and attempts to extract prices for a search keyword
 *   from Shopee, Lazada, and Tiki using DuckDuckGo and AI.
 * - PriceComparisonInput - The input type for the priceComparison function.
 * - PriceComparisonOutput - The return type for the priceComparison function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { duckDuckGoSearchTool, type DuckDuckGoSearchOutput } from '@/ai/tools/duckduckgo-search-tool';

const PriceComparisonInputSchema = z.object({
  productIdentifier: z
    .string()
    .describe('Từ khóa tìm kiếm sản phẩm.'),
});
export type PriceComparisonInput = z.infer<typeof PriceComparisonInputSchema>;

const ProductPriceInfoSchema = z.object({
  productName: z.string().describe('Tên sản phẩm được trích xuất.'),
  storeName: z.string().describe('Tên cửa hàng/website (ví dụ: Shopee, Lazada, Tiki).'),
  price: z.number().describe('Giá sản phẩm dưới dạng số. Nếu không tìm thấy, giá là 0.'),
  url: z.string().describe('URL trực tiếp đến trang sản phẩm.'),
  snippet: z.string().optional().describe('Mô tả ngắn từ kết quả tìm kiếm (nếu có).'),
});
export type ProductPriceInfo = z.infer<typeof ProductPriceInfoSchema>;

const PriceComparisonOutputSchema = z.object({
  items: z.array(ProductPriceInfoSchema).describe('Danh sách các sản phẩm tìm thấy và phân tích.'),
  searchContext: z.string().describe("Thông tin về truy vấn tìm kiếm đã được thực hiện."),
});
export type PriceComparisonOutput = z.infer<typeof PriceComparisonOutputSchema>;

export async function priceComparison(input: PriceComparisonInput): Promise<PriceComparisonOutput> {
  return priceComparisonFlow(input);
}

const TARGET_ECOMMERCE_DOMAINS = ['shopee.vn', 'lazada.vn', 'tiki.vn'];

const priceAnalysisPrompt = ai.definePrompt({
  name: 'priceAnalysisPrompt',
  input: { schema: z.object({ productIdentifier: z.string(), searchResults: z.array(ProductPriceInfoSchema.pick({ title: true, link: true, snippet: true }).extend({link: z.string()}).transform(val => ({...val, url: val.link}))) }) },
  output: { schema: z.object({ items: z.array(ProductPriceInfoSchema) }) },
  prompt: `Bạn là một trợ lý AI chuyên trích xuất thông tin sản phẩm từ kết quả tìm kiếm web.
Từ khóa tìm kiếm là: "{{productIdentifier}}".
Dưới đây là danh sách các kết quả tìm kiếm được lấy từ Shopee, Lazada, và Tiki:

{{#each searchResults}}
Kết quả số {{@index}}:
Tiêu đề: {{{this.title}}}
Link: {{{this.link}}}
Mô tả: {{{this.snippet}}}
--------------------
{{/each}}

Nhiệm vụ của bạn là xem xét TỪNG kết quả tìm kiếm và trích xuất thông tin sản phẩm nếu nó liên quan đến từ khóa "{{productIdentifier}}".
Đối với MỖI sản phẩm liên quan bạn tìm thấy từ danh sách trên, hãy cung cấp:
1.  \`productName\`: Tên sản phẩm đầy đủ, lấy từ Tiêu đề hoặc Mô tả.
2.  \`storeName\`: Tên trang web (ví dụ: "Shopee", "Lazada", "Tiki"). Suy ra từ tên miền trong Link. Ví dụ nếu link chứa "shopee.vn" thì storeName là "Shopee".
3.  \`price\`: Giá sản phẩm. Đây PHẢI LÀ MỘT SỐ (integer or float). Hãy cố gắng hết sức để tìm một con số cụ thể cho giá trong Tiêu đề hoặc Mô tả. Ví dụ: "Giá 150.000đ" -> 150000. Nếu giá được viết dạng "100k", hãy chuyển thành 100000. Nếu là một khoảng giá (ví dụ: "100.000 - 200.000"), hãy lấy giá trị thấp nhất. Nếu không tìm thấy giá số cụ thể, hoặc giá là "Liên hệ", "Miễn phí", hãy đặt giá trị là 0.
4.  \`url\`: Chính là trường Link của kết quả tìm kiếm.
5.  \`snippet\`: Chính là trường Mô tả của kết quả tìm kiếm.

Hãy tạo một danh sách các đối tượng, mỗi đối tượng tương ứng với một sản phẩm bạn trích xuất được.
Nếu không có kết quả tìm kiếm nào phù hợp hoặc không thể trích xuất thông tin, hãy trả về một danh sách rỗng.
Toàn bộ phản hồi của bạn PHẢI bằng tiếng Việt.
`,
});


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

    // Prepare search results for the AI prompt
    const searchResultsForAI = rawSearchResults.map(r => ({
        title: r.title,
        link: r.link,
        snippet: r.snippet
    }));

    try {
      const { output } = await priceAnalysisPrompt({ 
        productIdentifier: input.productIdentifier,
        // @ts-ignore TODO: fix type error, the transform in the schema definition should handle this
        searchResults: searchResultsForAI
      });

      if (!output || !output.items) {
        console.warn('[priceComparisonFlow] AI did not return items.');
        return {
          items: [],
          searchContext: `Không thể phân tích kết quả tìm kiếm cho "${input.productIdentifier}" từ Shopee, Lazada, Tiki.`,
        };
      }
      
      console.log(`[priceComparisonFlow] AI returned ${output.items.length} processed items.`);
      return {
        items: output.items,
        searchContext: `Kết quả tìm kiếm cho "${input.productIdentifier}" trên Shopee, Lazada, Tiki (được phân tích bởi AI).`,
      };
    } catch (error) {
      console.error('[priceComparisonFlow] Error calling AI for price analysis:', error);
      // Fallback to showing raw search results if AI fails
       const fallbackItems: ProductPriceInfo[] = rawSearchResults.map(result => {
        let storeName = 'Không rõ';
        try {
          const urlObj = new URL(result.link);
          if (urlObj.hostname.includes('shopee.vn')) storeName = 'Shopee';
          else if (urlObj.hostname.includes('lazada.vn')) storeName = 'Lazada';
          else if (urlObj.hostname.includes('tiki.vn')) storeName = 'Tiki';
          else storeName = urlObj.hostname.replace(/^www\./, '');
        } catch (e) { /* ignore */ }
        return {
          productName: result.title,
          storeName: storeName,
          price: 0, 
          url: result.link,
          snippet: result.snippet,
        };
      });
      return {
        items: fallbackItems,
        searchContext: `Hiển thị kết quả thô cho "${input.productIdentifier}" do lỗi phân tích AI. Giá không được trích xuất.`,
      };
    }
  }
);
