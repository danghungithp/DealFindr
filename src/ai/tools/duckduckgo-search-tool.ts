
'use server';
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
});

const SearchResultSchema = z.object({
  title: z.string().describe('The title of the search result.'),
  link: z.string().describe('The URL of the search result.'),
  snippet: z.string().describe('A brief snippet or description of the search result.'),
});

const DuckDuckGoSearchOutputSchema = z.array(SearchResultSchema).describe('A list of search results.');

// Explicitly use undefined for search options to rely on duck-duck-scrape defaults.
const DUCKDUCKGO_SEARCH_OPTIONS: SearchOptions | undefined = undefined;
const DEFAULT_MAX_RESULTS = 5;

export const duckDuckGoSearchTool = ai.defineTool(
  {
    name: 'duckDuckGoSearch',
    description: 'A search engine. Useful for finding information on the web, including current events, product pages, or general knowledge. Input should be a search query. Returns a list of search results including title, link, and snippet.',
    inputSchema: DuckDuckGoSearchInputSchema,
    outputSchema: DuckDuckGoSearchOutputSchema,
  },
  async (input) => {
    console.log(`DuckDuckGo searching for: "${input.query}" with options:`, DUCKDUCKGO_SEARCH_OPTIONS || 'defaults');
    try {
      // The 'search' function from 'duck-duck-scrape' returns an object { noResults: boolean, results: ScrapedResult[] }
      const searchResponse: DuckDuckGoAPISearchResults = await search(input.query, DUCKDUCKGO_SEARCH_OPTIONS);

      if (searchResponse.noResults || !searchResponse.results || searchResponse.results.length === 0) {
        console.log(`DuckDuckGo search for "${input.query}" returned no actual results or indicated noResults=true.`);
        return [];
      }

      const processedResults = searchResponse.results
        .map((result: ScrapedResult) => ({
          title: result.title,
          link: result.url,
          snippet: result.description,
        }))
        .slice(0, DEFAULT_MAX_RESULTS);

      console.log(`DuckDuckGo found ${processedResults.length} results for "${input.query}". First result title (if any): ${processedResults.length > 0 ? processedResults[0].title : 'N/A'}`);
      return processedResults;

    } catch (error: any) {
      console.error(`DuckDuckGo search error for query "${input.query}": ${error.message}`, { details: error });
      // Return empty array on error to allow the flow to continue gracefully.
      // The LLM can then decide based on empty results.
      return [];
    }
  }
);
