import { config } from 'dotenv';
config();

import '@/ai/flows/social-sentiment-analysis.ts';
import '@/ai/flows/price-comparison.ts';
import '@/ai/flows/product-summarization.ts';
import '@/ai/flows/discount-hunter.ts';
import '@/ai/tools/duckduckgo-search-tool.ts'; // Added import for the new tool
