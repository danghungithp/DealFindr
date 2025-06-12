
'use server';
/**
 * @fileOverview DuckDuckGo search tool for Genkit.
 *
 * - duckDuckGoSearchTool - A Genkit tool to perform searches using DuckDuckGo.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { search, type SearchOptions } from 'duck-duck-scrape';

const DuckDuckGoSearchInputSchema = z.object({
  query: z.string().describe('The search query.'),
});

const SearchResultSchema = z.object({
  title: z.string().describe('The title of the search result.'),
  link: z.string().describe('The URL of the search result.'),
  snippet: z.string().describe('A brief snippet or description of the search result.'),
});

const DuckDuckGoSearchOutputSchema = z.array(SearchResultSchema).describe('A list of search results.');

// Removed safeSearch option to allow for broader results by default.
// Other options like region or timelimit can be added if needed.
const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  // region: 'wt-wt', // Worldwide
  // timelimit: 'm', // Past month, 'd' for day, 'w' for week, 'y' for year
};
const DEFAULT_MAX_RESULTS = 5; 

export const duckDuckGoSearchTool = ai.defineTool(
  {
    name: 'duckDuckGoSearch',
    description: 'A search engine. Useful for finding information on the web, including current events, product pages, or general knowledge. Input should be a search query. Returns a list of search results including title, link, and snippet.',
    inputSchema: DuckDuckGoSearchInputSchema,
    outputSchema: DuckDuckGoSearchOutputSchema,
  },
  async (input) => {
    console.log(`DuckDuckGo searching for: "${input.query}" with options:`, DEFAULT_SEARCH_OPTIONS);
    try {
      const { results } = await search(input.query, DEFAULT_SEARCH_OPTIONS);
      
      if (!results) {
        console.log(`DuckDuckGo search for "${input.query}" returned no results array.`);
        return [];
      }
      
      const processedResults = results
        .map((result) => ({
          title: result.title,
          link: result.url,
          snippet: result.description,
        }))
        .slice(0, DEFAULT_MAX_RESULTS);
      
      console.log(`DuckDuckGo found ${processedResults.length} results for "${input.query}".`);
      return processedResults;

    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      return []; 
    }
  }
);

