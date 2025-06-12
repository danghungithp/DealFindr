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

const DEFAULT_SEARCH_OPTIONS: SearchOptions = {
  safeSearch: 'Moderate', 
  // You can add other options like region: 'wt-wt', // Worldwide
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
    try {
      const { results } = await search(input.query, DEFAULT_SEARCH_OPTIONS);
      
      if (!results) {
        console.log(`DuckDuckGo search for "${input.query}" returned no results array.`);
        return [];
      }
      
      return results
        .map((result) => ({
          title: result.title,
          link: result.url,
          snippet: result.description,
        }))
        .slice(0, DEFAULT_MAX_RESULTS);
    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      return []; 
    }
  }
);
