/**
 * @fileOverview DuckDuckGo search tool for Genkit.
 *
 * - duckDuckGoSearchTool - A Genkit tool to perform searches using DuckDuckGo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { search, type SearchOptions, type Results as DuckDuckGoAPISearchResults, type ScrapedResult } from 'duck-duck-scrape';

const DuckDuckGoSearchInputSchema = z.object({
  query: z.string().describe('The search query.'),
  domains: z.array(z.string()).optional().describe('A list of domains to restrict the search to (e.g., ["shopee.vn", "lazada.vn"]).'),
});
export type DuckDuckGoSearchInput = z.infer<typeof DuckDuckGoSearchInputSchema>;

const SearchResultSchema = z.object({
  title: z.string().describe('The title of the search result.'),
  link: z.string().url().describe('The URL of the search result.'),
  snippet: z.string().describe('A brief snippet or description of the search result.'),
});
export type DuckDuckGoSearchResult = z.infer<typeof SearchResultSchema>;

export const DuckDuckGoSearchOutputSchema = z.array(SearchResultSchema).describe('A list of search results.');
export type DuckDuckGoSearchOutput = z.infer<typeof DuckDuckGoSearchOutputSchema>;


// Explicitly use undefined for search options to rely on duck-duck-scrape defaults,
// unless we are doing site-specific search.
const DEFAULT_MAX_RESULTS = 10; // Tăng số lượng kết quả tối đa lên 10

export const duckDuckGoSearchTool = ai.defineTool(
  {
    name: 'duckDuckGoSearch',
    description: 'A search engine. Useful for finding information on the web. Input should be a search query, and can optionally include a list of domains to search within. Returns a list of search results including title, link, and snippet.',
    inputSchema: DuckDuckGoSearchInputSchema,
    outputSchema: DuckDuckGoSearchOutputSchema,
  },
  async (input: DuckDuckGoSearchInput): Promise<DuckDuckGoSearchOutput> => {
    let searchQuery = input.query;
    if (input.domains && input.domains.length > 0) {
      const siteFilters = input.domains.map(domain => `site:${domain.trim()}`).join(" OR ");
      searchQuery = `${input.query} (${siteFilters})`;
    }
    
    console.log(`DuckDuckGo searching for: "${searchQuery}"`);

    try {
      const searchOptions: SearchOptions = { 
        region: 'vn-vi' // Specify region for Vietnam (Vietnamese)
      };
      const searchResponse: DuckDuckGoAPISearchResults = await search(searchQuery, searchOptions);

      // console.log('[duckDuckGoSearchTool] Full searchResponse:', JSON.stringify(searchResponse, null, 2)); // For deeper debugging

      if (searchResponse.noResults || !searchResponse.results || searchResponse.results.length === 0) {
        console.log(`DuckDuckGo search for "${searchQuery}" returned no actual results or indicated noResults=true. Response object:`, searchResponse);
        return [];
      }

      const processedResults = searchResponse.results
        .map((result: ScrapedResult) => ({
          title: result.title || 'Không có tiêu đề',
          link: result.url,
          snippet: result.description || 'Không có mô tả',
        }))
        .slice(0, DEFAULT_MAX_RESULTS);

      console.log(`DuckDuckGo found ${processedResults.length} raw results from library for "${searchQuery}". Sliced to ${DEFAULT_MAX_RESULTS}. First result title (if any): ${processedResults.length > 0 ? processedResults[0].title : 'N/A'}`);
      return processedResults;

    } catch (error: any) {
      console.error(`DuckDuckGo search error for query "${searchQuery}": ${error.message}`, { details: error });
      return [];
    }
  }
);

