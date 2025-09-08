// Enhanced search service using Fuse.js for fuzzy matching and FlexSearch for indexing
import Fuse from 'fuse.js';
import { Document } from 'flexsearch';
import { database } from './database';
import { nlpService } from './nlp-service';

export interface SearchableItem {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  content?: string;
  location?: string;
  tags: string[];
  _type: string;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

export interface EnhancedSearchResult extends SearchableItem {
  _score: number;
  _matchedFields: string[];
  _snippet?: string;
}

export class EnhancedSearchService {
  private static instance: EnhancedSearchService;
  private searchIndex: Document<SearchableItem> | null = null;
  private fuseInstances: Map<string, Fuse<SearchableItem>> = new Map();
  private lastIndexUpdate = 0;
  private readonly indexUpdateInterval = 5 * 60 * 1000; // 5 minutes

  static getInstance(): EnhancedSearchService {
    if (!EnhancedSearchService.instance) {
      EnhancedSearchService.instance = new EnhancedSearchService();
    }
    return EnhancedSearchService.instance;
  }

  async initialize(): Promise<void> {
    await this.buildSearchIndex();
  }

  async search(query: string, options?: {
    modules?: string[];
    limit?: number;
    threshold?: number;
  }): Promise<EnhancedSearchResult[]> {
    const { modules, limit = 20, threshold = 0.3 } = options || {};
    
    // Parse query with NLP
    const parsedQuery = nlpService.parseSearchQuery(query);
    
    // Check if index needs update
    if (Date.now() - this.lastIndexUpdate > this.indexUpdateInterval) {
      await this.buildSearchIndex();
    }

    const results = new Map<string, EnhancedSearchResult>();

    // 1. Exact matches using FlexSearch (highest priority)
    if (this.searchIndex) {
      try {
        const exactResults = await this.searchIndex.search(query, { limit: limit * 2 });
        // FlexSearch returns different format, need to handle properly
        console.log('FlexSearch results:', exactResults);
      } catch (error) {
        console.log('FlexSearch error:', error);
      }
    }

    // 2. Fuzzy matches using Fuse.js (medium priority)
    for (const [moduleType, fuseInstance] of this.fuseInstances) {
      if (modules && !modules.includes(moduleType)) continue;
      
      const fuseResults = fuseInstance.search(query, { limit: limit });
      fuseResults.forEach(result => {
        const key = `${moduleType}-${result.item.id}`;
        const score = 1 - (result.score || 0);
        
        if (score >= threshold && (!results.has(key) || results.get(key)!._score < score)) {
          results.set(key, {
            ...result.item,
            _score: score * 0.8, // Slightly lower than exact matches
            _matchedFields: result.matches?.map(m => m.key || '') || [],
            _snippet: this.generateSnippet(result.item, query)
          });
        }
      });
    }

    // 3. NLP-enhanced matches (lower priority)
    const nlpResults = await this.searchWithNLP(parsedQuery, modules);
    nlpResults.forEach(item => {
      const key = `${item._type}-${item.id}`;
      if (!results.has(key) || results.get(key)!._score < item._score) {
        results.set(key, item);
      }
    });

    // Sort by score and return
    return Array.from(results.values())
      .sort((a, b) => b._score - a._score)
      .slice(0, limit);
  }

  // Semantic search using entity matching
  async semanticSearch(query: string, modules?: string[]): Promise<EnhancedSearchResult[]> {
    const parsedQuery = nlpService.parseSearchQuery(query);
    const allResults: EnhancedSearchResult[] = [];

    // Search for people
    if (parsedQuery.entities.people.length > 0) {
      const peopleResults = await this.searchByEntity('people', parsedQuery.entities.people);
      allResults.push(...peopleResults);
    }

    // Search for places
    if (parsedQuery.entities.places.length > 0) {
      const placesResults = await this.searchByEntity('places', parsedQuery.entities.places);
      allResults.push(...placesResults);
    }

    // Search by filters
    const filteredResults = await this.searchByFilters(parsedQuery.filters);
    allResults.push(...filteredResults);

    // Deduplicate and sort
    const uniqueResults = new Map<string, EnhancedSearchResult>();
    allResults.forEach(result => {
      const key = `${result._type}-${result.id}`;
      if (!uniqueResults.has(key) || uniqueResults.get(key)!._score < result._score) {
        uniqueResults.set(key, result);
      }
    });

    return Array.from(uniqueResults.values())
      .filter(result => !modules || modules.includes(result._type))
      .sort((a, b) => b._score - a._score);
  }

  private async buildSearchIndex(): Promise<void> {
    console.log('Building search index...');
    
    // Initialize FlexSearch index
    this.searchIndex = new Document({
      id: 'id',
      index: ['title', 'name', 'description', 'content', 'location', 'tags']
    });

    // Clear existing Fuse instances
    this.fuseInstances.clear();

    const stores = [
      'travelPins', 'people', 'journalEntries', 'expenses',
      'checklistItems', 'learningEntries', 'foodEntries', 'gearItems'
    ];

    for (const storeName of stores) {
      try {
        const items = await database.getAll<SearchableItem>(storeName);
        const processedItems = items.map(item => ({
          ...item,
          _type: storeName,
          searchableText: this.createSearchableText(item)
        }));

        // Add to FlexSearch
        processedItems.forEach(item => {
          if (this.searchIndex) {
            try {
              this.searchIndex.add(item);
            } catch (error) {
              console.error('Error adding to search index:', error);
            }
          }
        });

        // Create Fuse instance for this module
        const fuseOptions = {
          keys: [
            { name: 'title', weight: 0.3 },
            { name: 'name', weight: 0.3 },
            { name: 'description', weight: 0.2 },
            { name: 'content', weight: 0.2 },
            { name: 'location', weight: 0.15 },
            { name: 'tags', weight: 0.1 },
            { name: 'searchableText', weight: 0.1 }
          ],
          threshold: 0.4,
          includeScore: true,
          includeMatches: true,
          minMatchCharLength: 2
        };

        this.fuseInstances.set(storeName, new Fuse(processedItems, fuseOptions));
      } catch (error) {
        console.error(`Failed to index ${storeName}:`, error);
      }
    }

    this.lastIndexUpdate = Date.now();
    console.log('Search index built successfully');
  }

  private createSearchableText(item: SearchableItem): string {
    const parts = [
      item.title || '',
      item.name || '',
      item.description || '',
      item.content || '',
      item.location || '',
      ...(Array.isArray(item.tags) ? item.tags : [])
    ];
    
    return parts.filter(part => part).join(' ').toLowerCase();
  }

  private async searchWithNLP(parsedQuery: any, modules?: string[]): Promise<EnhancedSearchResult[]> {
    const results: EnhancedSearchResult[] = [];
    
    // Use extracted search terms for broader matching
    if (parsedQuery.searchTerms.length > 0) {
      const termQuery = parsedQuery.searchTerms.join(' ');
      const basicResults = await this.search(termQuery, { modules, limit: 10 });
      
      basicResults.forEach(result => {
        results.push({
          ...result,
          _score: result._score * 0.6, // Lower score for NLP matches
          _matchedFields: [...result._matchedFields, 'nlp']
        });
      });
    }
    
    return results;
  }

  private async searchByEntity(entityType: string, entities: string[]): Promise<EnhancedSearchResult[]> {
    const results: EnhancedSearchResult[] = [];
    
    for (const entity of entities) {
      const entityResults = await this.search(entity, { limit: 5 });
      entityResults.forEach(result => {
        results.push({
          ...result,
          _score: result._score * 0.7,
          _matchedFields: [...result._matchedFields, entityType]
        });
      });
    }
    
    return results;
  }

  private async searchByFilters(filters: any): Promise<EnhancedSearchResult[]> {
    const results: EnhancedSearchResult[] = [];
    
    // Location filter
    if (filters.location) {
      const locationResults = await this.search(filters.location, { limit: 10 });
      results.push(...locationResults.map(r => ({ 
        ...r, 
        _score: r._score * 0.8,
        _matchedFields: [...r._matchedFields, 'location']
      })));
    }
    
    // Person filter
    if (filters.person) {
      const personResults = await this.search(filters.person, { modules: ['people'], limit: 5 });
      results.push(...personResults.map(r => ({ 
        ...r, 
        _score: r._score * 0.9,
        _matchedFields: [...r._matchedFields, 'person']
      })));
    }
    
    return results;
  }

  private generateSnippet(item: SearchableItem, query: string): string {
    const content = item.description || item.content || item.title || item.name || '';
    const queryWords = query.toLowerCase().split(' ');
    
    // Find the best snippet around the query match
    const sentences = content.split(/[.!?]+/);
    let bestSentence = '';
    let maxMatches = 0;
    
    sentences.forEach(sentence => {
      const matches = queryWords.filter(word => 
        sentence.toLowerCase().includes(word)
      ).length;
      
      if (matches > maxMatches) {
        maxMatches = matches;
        bestSentence = sentence;
      }
    });
    
    return bestSentence.trim().substring(0, 150) + (bestSentence.length > 150 ? '...' : '');
  }

  // Force rebuild of search index
  async rebuildIndex(): Promise<void> {
    this.lastIndexUpdate = 0;
    await this.buildSearchIndex();
  }
}

export const enhancedSearch = EnhancedSearchService.getInstance();