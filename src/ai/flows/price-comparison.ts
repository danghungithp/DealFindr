
'use server';

/**
 * @fileOverview A product listing utility using DuckDuckGo search.
 *
 * - priceComparison - A function that lists products for a search keyword using DuckDuckGo.
 * - PriceComparisonInput - The input type for the priceComparison function.
 * - PriceComparisonOutput - The return type for the priceComparison function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { duckDuckGoSearchTool } from '@/ai/tools/duckduckgo-search-tool'; // Assuming this tool returns an array of { title, link, snippet }

const PriceComparisonInputSchema = z.object({
  productIdentifier: z
    .string()
    .describe('Từ khóa tìm kiếm sản phẩm.'),
});
export type PriceComparisonInput = z.infer<typeof PriceComparisonInputSchema>;

const ProductPriceInfoSchema = z.object({
  productName: z.string().describe('Tên sản phẩm từ kết quả tìm kiếm DuckDuckGo (thường là tiêu đề trang).'),
  storeName: z.string().describe('Tên cửa hàng/website (thường là tên miền của liên kết).'),
  price: z.number().describe('Giá sản phẩm. Hiện tại, giá sẽ được đặt là 0 do không sử dụng AI để trích xuất thông tin này từ snippet một cách đáng tin cậy.'),
  url: z.string().describe('URL trực tiếp đến trang kết quả tìm kiếm.'),
  snippet: z.string().optional().describe('Mô tả ngắn từ kết quả tìm kiếm DuckDuckGo.'),
});

const PriceComparisonOutputSchema = z.object({
  items: z.array(ProductPriceInfoSchema).describe('Danh sách các sản phẩm tìm thấy từ DuckDuckGo.'),
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
  async (input) => {
    const rawSearchResults = await duckDuckGoSearchTool({ query: input.productIdentifier });

    const formattedItems: z.infer<typeof ProductPriceInfoSchema>[] = rawSearchResults.map(result => {
      let storeName = 'Không rõ';
      try {
        const urlObj = new URL(result.link);
        storeName = urlObj.hostname.replace(/^www\./, ''); // Remove www.
      } catch (e) {
        // Invalid URL, keep storeName as 'Không rõ'
      }

      return {
        productName: result.title,
        storeName: storeName,
        price: 0, // Consistently set to 0 as AI is not used for extraction.
        url: result.link,
        snippet: result.snippet,
      };
    });

    return {
      items: formattedItems,
      searchContext: `Kết quả tìm kiếm trên DuckDuckGo cho từ khóa: "${input.productIdentifier}"`,
    };
  }
);

