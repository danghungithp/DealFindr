
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
  prompt: `Bạn là một trợ lý mua sắm AI chuyên nghiệp tại Việt Nam. Bạn có khả năng sử dụng công cụ tìm kiếm \`duckDuckGoSearch\` để tìm thông tin sản phẩm.
Dựa trên đầu vào sau: "{{productIdentifier}}", hãy thực hiện một trong hai hành động sau:

1. NẾU "{{productIdentifier}}" là một URL đến trang sản phẩm (ví dụ: chứa shopee.vn, lazada.vn, tiki.vn):
   - Cố gắng xác định tên sản phẩm từ URL đó.
   - Sử dụng công cụ \`duckDuckGoSearch\` với các truy vấn như "[tên sản phẩm đã xác định] giá tốt nhất Shopee Lazada Tiki" để tìm và so sánh giá của CHÍNH XÁC sản phẩm đó trên các trang thương mại điện tử lớn ở Việt Nam (ưu tiên Shopee, Lazada, Tiki).
   - Trả về một danh sách các mục trong 'items', trong đó mỗi mục có 'productName' (phải giống nhau cho tất cả các mục, là tên sản phẩm đã xác định), 'storeName', 'price' (dạng số), và 'url' đến sản phẩm đó ở cửa hàng tương ứng.
   - Nếu có thể, xác định 'cheapestStore' và 'cheapestPrice' (dạng số) từ danh sách này.
   - Đặt 'searchContext' thành "Kết quả so sánh giá cho [Tên sản phẩm đã xác định]".
   - Nếu không tìm thấy sản phẩm hoặc không thể so sánh giá, trả về danh sách 'items' rỗng và 'searchContext' là "Không tìm thấy thông tin so sánh giá cho URL cung cấp."

2. NẾU "{{productIdentifier}}" KHÔNG phải là URL (mà là một từ khóa tìm kiếm chung, ví dụ: 'tai nghe bluetooth', 'iphone 15'):
   - BẮT BUỘC sử dụng công cụ \`duckDuckGoSearch\` để tìm kiếm thông tin về "{{productIdentifier}}". Hãy cố gắng tạo ra các truy vấn tìm kiếm hiệu quả để tìm các sản phẩm trên các trang thương mại điện tử phổ biến ở Việt Nam như Shopee, Lazada, Tiki. Ví dụ về các truy vấn có thể là: "{{productIdentifier}} giá tốt nhất", "mua {{productIdentifier}}", "{{productIdentifier}} Shopee", "{{productIdentifier}} Lazada", "{{productIdentifier}} Tiki".
   - Từ kết quả tìm kiếm do công cụ \`duckDuckGoSearch\` trả về (mỗi kết quả bao gồm \`title\`, \`link\`, \`snippet\`), hãy phân tích kỹ lưỡng để chọn lọc và liệt kê tối đa 5 sản phẩm liên quan nhất. Đối với mỗi sản phẩm được chọn, bạn PHẢI cung cấp:
     - 'productName': Tên đầy đủ và cụ thể của sản phẩm (thường được trích xuất từ \`title\` của kết quả tìm kiếm).
     - 'storeName': Tên cửa hàng bán sản phẩm (ví dụ: Shopee, Lazada, Tiki - cố gắng suy luận từ \`link\` hoặc \`snippet\` của kết quả tìm kiếm).
     - 'price': Giá của sản phẩm (PHẢI LÀ MỘT SỐ). Cố gắng hết sức để trích xuất giá từ \`snippet\` hoặc \`title\`. Nếu giá được tìm thấy dưới dạng một khoảng (ví dụ: "1.000.000đ - 2.000.000đ"), hãy chọn một giá đại diện trong khoảng đó (ví dụ: 1000000). Nếu không thể tìm thấy giá một cách rõ ràng dưới dạng số, hãy đặt giá trị là 0.
     - 'url': Đường link trực tiếp đến trang sản phẩm (lấy từ trường \`link\` của kết quả tìm kiếm).
   - Trường 'cheapestStore' và 'cheapestPrice' có thể để trống (không được cung cấp) trong trường hợp này.
   - Đặt 'searchContext' thành "Danh sách sản phẩm gợi ý cho từ khóa '{{productIdentifier}}'".
   - Nếu sau khi tìm kiếm và phân tích, bạn không thể tìm thấy bất kỳ sản phẩm nào phù hợp, hãy trả về một danh sách 'items' rỗng và 'searchContext' là "Không tìm thấy sản phẩm nào cho từ khóa '{{productIdentifier}}'."

Quan trọng:
- Khi sử dụng công cụ \`duckDuckGoSearch\`, hãy xem xét kết quả trả về (\`title\`, \`link\`, \`snippet\`) một cách cẩn thận để trích xuất thông tin chính xác về tên sản phẩm, cửa hàng, giá (dạng số) và URL.
- Giá PHẢI LÀ SỐ. Nếu không tìm được giá cụ thể, hãy đặt giá là 0.
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
