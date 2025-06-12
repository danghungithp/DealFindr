
'use server';

/**
 * @fileOverview A product price comparison and listing AI agent.
 *
 * - priceComparison - A function that handles price comparison for a specific product URL or lists products for a search keyword.
 * - PriceComparisonInput - The input type for the priceComparison function.
 * - PriceComparisonOutput - The return type for the priceComparison function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { duckDuckGoSearchTool } from '@/ai/tools/duckduckgo-search-tool';

const PriceComparisonInputSchema = z.object({
  productIdentifier: z
    .string()
    .describe('The URL of the product to compare prices for, or a search keyword to list relevant products.'),
});
export type PriceComparisonInput = z.infer<typeof PriceComparisonInputSchema>;

const ProductPriceInfoSchema = z.object({
  productName: z.string().describe('Tên đầy đủ của sản phẩm được tìm thấy hoặc so sánh.'),
  storeName: z.string().describe('Tên của cửa hàng bán sản phẩm (ví dụ: Shopee, Lazada, Tiki).'),
  price: z.number().describe('Giá của sản phẩm tại cửa hàng đó, bằng số.'),
  url: z.string().describe('URL trực tiếp đến trang sản phẩm tại cửa hàng đó.'),
});

const PriceComparisonOutputSchema = z.object({
  items: z.array(ProductPriceInfoSchema).describe('Danh sách các sản phẩm tìm thấy hoặc các lựa chọn giá cho một sản phẩm cụ thể.'),
  cheapestStore: z.string().optional().describe('Tên cửa hàng có giá rẻ nhất (chỉ áp dụng khi so sánh một sản phẩm cụ thể từ URL).'),
  cheapestPrice: z.number().optional().describe('Giá rẻ nhất tìm được (chỉ áp dụng khi so sánh một sản phẩm cụ thể từ URL, phải là số).'),
  searchContext: z.string().describe("Mô tả ngắn gọn về kết quả tìm kiếm, ví dụ: 'So sánh giá cho [tên sản phẩm]' hoặc 'Danh sách sản phẩm cho từ khóa [từ khóa]'."),
});
export type PriceComparisonOutput = z.infer<typeof PriceComparisonOutputSchema>;

export async function priceComparison(input: PriceComparisonInput): Promise<PriceComparisonOutput> {
  return priceComparisonFlow(input);
}

const prompt = ai.definePrompt({
  name: 'priceComparisonPrompt',
  input: {schema: PriceComparisonInputSchema},
  output: {schema: PriceComparisonOutputSchema},
  tools: [duckDuckGoSearchTool],
  prompt: `Bạn là một trợ lý mua sắm AI chuyên nghiệp tại Việt Nam. Bạn có khả năng sử dụng công cụ tìm kiếm duckDuckGoSearch để tìm thông tin sản phẩm.
Dựa trên đầu vào sau: "{{productIdentifier}}", hãy thực hiện một trong hai hành động sau:

1. NẾU "{{productIdentifier}}" là một URL đến trang sản phẩm (ví dụ: chứa shopee.vn, lazada.vn, tiki.vn):
   - Cố gắng xác định tên sản phẩm từ URL đó.
   - Sử dụng công cụ \`duckDuckGoSearch\` với các truy vấn như "[tên sản phẩm đã xác định] giá tốt nhất Shopee Lazada Tiki" để tìm và so sánh giá của CHÍNH XÁC sản phẩm đó trên các trang thương mại điện tử lớn ở Việt Nam (ưu tiên Shopee, Lazada, Tiki).
   - Trả về một danh sách các mục trong 'items', trong đó mỗi mục có 'productName' (phải giống nhau cho tất cả các mục, là tên sản phẩm đã xác định), 'storeName', 'price' (dạng số), và 'url' đến sản phẩm đó ở cửa hàng tương ứng.
   - Nếu có thể, xác định 'cheapestStore' và 'cheapestPrice' (dạng số) từ danh sách này.
   - Đặt 'searchContext' thành "Kết quả so sánh giá cho [Tên sản phẩm đã xác định]".
   - Nếu không tìm thấy sản phẩm hoặc không thể so sánh giá, trả về danh sách 'items' rỗng và 'searchContext' là "Không tìm thấy thông tin so sánh giá cho URL cung cấp."

2. NẾU "{{productIdentifier}}" KHÔNG phải là URL (mà là một từ khóa tìm kiếm chung, ví dụ: 'tai nghe bluetooth', 'iphone 15'):
   - Sử dụng công cụ \`duckDuckGoSearch\` với truy vấn là "{{productIdentifier}} site:shopee.vn OR site:lazada.vn OR site:tiki.vn" hoặc các truy vấn tương tự như "{{productIdentifier}} mua ở đâu", "{{productIdentifier}} shopee", "{{productIdentifier}} lazada", "{{productIdentifier}} tiki" để tìm các sản phẩm liên quan trên các trang Shopee, Lazada, Tiki.
   - Từ kết quả tìm kiếm (bao gồm title, link, snippet), chọn lọc và liệt kê tối đa 5-7 sản phẩm nổi bật. Mỗi sản phẩm trong danh sách 'items' phải có:
     - 'productName': tên sản phẩm cụ thể tìm được (thường từ 'title' của kết quả tìm kiếm).
     - 'storeName': tên cửa hàng (Shopee, Lazada, hoặc Tiki - suy ra từ 'link' hoặc 'snippet').
     - 'price': giá sản phẩm (dạng số). Cố gắng trích xuất giá từ 'snippet' hoặc 'title' nếu có. Nếu không tìm thấy giá một cách rõ ràng, bạn có thể bỏ qua sản phẩm đó hoặc đặt giá là 0.
     - 'url': 'link' trực tiếp từ kết quả tìm kiếm.
   - Trường 'cheapestStore' và 'cheapestPrice' có thể để trống (không cung cấp) trong trường hợp này.
   - Đặt 'searchContext' thành "Danh sách sản phẩm gợi ý cho từ khóa '{{productIdentifier}}'".
   - Nếu không tìm thấy sản phẩm nào sau khi tìm kiếm, trả về danh sách 'items' rỗng và 'searchContext' là "Không tìm thấy sản phẩm nào cho từ khóa '{{productIdentifier}}'."

Quan trọng:
- Khi sử dụng công cụ \`duckDuckGoSearch\`, hãy xem xét kết quả trả về (title, link, snippet) một cách cẩn thận để trích xuất thông tin chính xác về tên sản phẩm, cửa hàng, giá và URL.
- Giá phải là số (number). Nếu không tìm được giá, hãy cân nhắc bỏ qua sản phẩm hoặc đặt giá là 0.
- URL phải là liên kết trực tiếp đến sản phẩm từ kết quả tìm kiếm.
- Toàn bộ phản hồi của bạn PHẢI bằng tiếng Việt.
- Chỉ trả về các trường đã định nghĩa trong schema output.
`,
});

const priceComparisonFlow = ai.defineFlow(
  {
    name: 'priceComparisonFlow',
    inputSchema: PriceComparisonInputSchema,
    outputSchema: PriceComparisonOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
