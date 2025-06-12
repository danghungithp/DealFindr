
import { config } from 'dotenv';
config();

import '@/ai/flows/social-sentiment-analysis.ts';
// import '@/ai/flows/price-comparison.ts'; // Old import
import '@/ai/flows/web-product-insights.ts'; // New import
import '@/ai/flows/product-summarization.ts';
import '@/ai/flows/discount-hunter.ts';
import '@/ai/tools/duckduckgo-search-tool.ts';

