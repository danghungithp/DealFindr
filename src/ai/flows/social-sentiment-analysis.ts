'use server';

/**
 * @fileOverview This file defines a Genkit flow for analyzing social media sentiment related to a product.
 *
 * - analyzeSocialSentiment - A function that takes a product name or link and returns a sentiment summary.
 * - SocialSentimentInput - The input type for the analyzeSocialSentiment function.
 * - SocialSentimentOutput - The return type for the analyzeSocialSentiment function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SocialSentimentInputSchema = z.object({
  productIdentifier: z
    .string()
    .describe('The name or link of the product to analyze social sentiment for.'),
});
export type SocialSentimentInput = z.infer<typeof SocialSentimentInputSchema>;

const SocialSentimentOutputSchema = z.object({
  sentimentSummary: z
    .string()
    .describe(
      'A summary of the overall sentiment towards the product on social media platforms.'
    ),
  positiveHighlights: z.string().describe('Highlights of positive feedback.'),
  negativeHighlights: z.string().describe('Highlights of negative feedback.'),
});
export type SocialSentimentOutput = z.infer<typeof SocialSentimentOutputSchema>;

export async function analyzeSocialSentiment(
  input: SocialSentimentInput
): Promise<SocialSentimentOutput> {
  return analyzeSocialSentimentFlow(input);
}

const prompt = ai.definePrompt({
  name: 'socialSentimentPrompt',
  input: {schema: SocialSentimentInputSchema},
  output: {schema: SocialSentimentOutputSchema},
  prompt: `Bạn là một trợ lý AI chuyên phân tích cảm xúc trên mạng xã hội.

  Hãy phân tích các nền tảng mạng xã hội để xác định cảm xúc chung của công chúng đối với sản phẩm sau:

  Sản phẩm: {{{productIdentifier}}}

  Cung cấp một bản tóm tắt ngắn gọn về cảm xúc tổng thể, nêu bật cả phản hồi tích cực và tiêu cực.
  Không đề cập rằng bạn là một AI. Tập trung vào việc cung cấp một phân tích sâu sắc mà một nhà phân tích mạng xã hội con người sẽ tạo ra.
  Hãy nhớ bao gồm các chi tiết về trải nghiệm của khách hàng, các vấn đề tiềm ẩn và đưa ra đề xuất cho khách hàng.
  Bản tóm tắt cảm xúc phải dưới 200 từ.
  Các phần phản hồi tích cực và tiêu cực phải dưới 100 từ mỗi phần.
  Toàn bộ phản hồi của bạn PHẢI bằng tiếng Việt.
  `,
});

const analyzeSocialSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeSocialSentimentFlow',
    inputSchema: SocialSentimentInputSchema,
    outputSchema: SocialSentimentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
