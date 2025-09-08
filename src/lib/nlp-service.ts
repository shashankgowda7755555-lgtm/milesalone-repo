// Offline NLP Service using compromise.js for entity extraction
import nlp from 'compromise';

export interface ExtractedEntities {
  people: string[];
  places: string[];
  organizations: string[];
  money: string[];
  dates: string[];
  topics: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  categories: string[];
}

export interface SearchQuery {
  originalQuery: string;
  entities: ExtractedEntities;
  searchTerms: string[];
  filters: {
    type?: string;
    location?: string;
    person?: string;
    dateRange?: { start?: string; end?: string };
    category?: string;
    amount?: { min?: number; max?: number };
  };
}

export class NLPService {
  private static instance: NLPService;

  static getInstance(): NLPService {
    if (!NLPService.instance) {
      NLPService.instance = new NLPService();
    }
    return NLPService.instance;
  }

  // Extract entities from text
  extractEntities(text: string): ExtractedEntities {
    const doc = nlp(text);

    return {
      people: this.extractPeople(doc),
      places: this.extractPlaces(doc),
      organizations: this.extractOrganizations(doc),
      money: this.extractMoney(doc),
      dates: this.extractDates(doc),
      topics: this.extractTopics(doc),
      sentiment: this.analyzeSentiment(doc),
      categories: this.categorizeContent(doc),
    };
  }

  // Parse natural language search queries
  parseSearchQuery(query: string): SearchQuery {
    const doc = nlp(query);
    const entities = this.extractEntities(query);
    
    return {
      originalQuery: query,
      entities,
      searchTerms: this.extractSearchTerms(doc),
      filters: this.extractFilters(doc, query)
    };
  }

  // Generate tags for content automatically
  generateTags(text: string, type?: string): string[] {
    const doc = nlp(text);
    const tags = new Set<string>();

    // Extract nouns as potential tags
    const nouns = doc.nouns().json();
    nouns.forEach((noun: any) => {
      if (noun.text.length > 2 && noun.text.length < 20) {
        tags.add(noun.text.toLowerCase());
      }
    });

    // Extract topics
    const topics = this.extractTopics(doc);
    topics.forEach(topic => tags.add(topic));

    // Type-specific tags
    if (type) {
      tags.add(type);
    }

    // Add category-based tags
    const categories = this.categorizeContent(doc);
    categories.forEach(category => tags.add(category));

    return Array.from(tags).slice(0, 10); // Limit to 10 tags
  }

  private extractPeople(doc: any): string[] {
    const people = doc.people().json();
    return people.map((person: any) => person.text).filter((name: string) => name.length > 1);
  }

  private extractPlaces(doc: any): string[] {
    const places = doc.places().json();
    return places.map((place: any) => place.text).filter((name: string) => name.length > 1);
  }

  private extractOrganizations(doc: any): string[] {
    const orgs = doc.organizations().json();
    return orgs.map((org: any) => org.text).filter((name: string) => name.length > 1);
  }

  private extractMoney(doc: any): string[] {
    const money = doc.money().json();
    return money.map((m: any) => m.text);
  }

  private extractDates(doc: any): string[] {
    const dates = doc.dates().json();
    return dates.map((date: any) => date.text);
  }

  private extractTopics(doc: any): string[] {
    const topics = new Set<string>();
    
    // Travel-related keywords
    const travelKeywords = ['travel', 'trip', 'vacation', 'journey', 'adventure', 'explore', 'visit', 'tour'];
    const foodKeywords = ['food', 'restaurant', 'meal', 'cuisine', 'dining', 'eat', 'taste', 'cook'];
    const cultureKeywords = ['culture', 'museum', 'temple', 'church', 'monument', 'art', 'history'];
    const natureKeywords = ['nature', 'mountain', 'beach', 'forest', 'park', 'hiking', 'outdoor'];
    
    const text = doc.text().toLowerCase();
    
    [travelKeywords, foodKeywords, cultureKeywords, natureKeywords].forEach((keywords, index) => {
      const categories = ['travel', 'food', 'culture', 'nature'];
      if (keywords.some(keyword => text.includes(keyword))) {
        topics.add(categories[index]);
      }
    });

    return Array.from(topics);
  }

  private analyzeSentiment(doc: any): 'positive' | 'negative' | 'neutral' {
    // Simple sentiment analysis based on word polarity
    const text = doc.text().toLowerCase();
    
    const positiveWords = ['amazing', 'great', 'wonderful', 'beautiful', 'love', 'perfect', 'excellent', 'fantastic', 'awesome', 'good', 'best', 'incredible'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'worst', 'disappointing', 'poor', 'sad', 'angry'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    positiveWords.forEach(word => {
      if (text.includes(word)) positiveScore++;
    });
    
    negativeWords.forEach(word => {
      if (text.includes(word)) negativeScore++;
    });
    
    if (positiveScore > negativeScore) return 'positive';
    if (negativeScore > positiveScore) return 'negative';
    return 'neutral';
  }

  private categorizeContent(doc: any): string[] {
    const text = doc.text().toLowerCase();
    const categories = [];
    
    // Category mappings
    const categoryMap = {
      food: ['food', 'restaurant', 'meal', 'eat', 'cook', 'taste', 'cuisine', 'dish'],
      travel: ['travel', 'trip', 'vacation', 'journey', 'flight', 'hotel', 'booking'],
      culture: ['museum', 'temple', 'church', 'monument', 'art', 'history', 'culture'],
      nature: ['nature', 'mountain', 'beach', 'forest', 'park', 'hiking', 'outdoor'],
      adventure: ['adventure', 'explore', 'expedition', 'trekking', 'climbing', 'extreme'],
      entertainment: ['movie', 'show', 'concert', 'festival', 'party', 'music', 'dance'],
      shopping: ['shop', 'buy', 'purchase', 'market', 'store', 'mall', 'souvenir'],
      transport: ['transport', 'bus', 'train', 'taxi', 'uber', 'drive', 'walk']
    };
    
    Object.entries(categoryMap).forEach(([category, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        categories.push(category);
      }
    });
    
    return categories;
  }

  private extractSearchTerms(doc: any): string[] {
    const terms = new Set<string>();
    
    // Add nouns
    const nouns = doc.nouns().json();
    nouns.forEach((noun: any) => {
      if (noun.text.length > 2) {
        terms.add(noun.text.toLowerCase());
      }
    });
    
    // Add adjectives
    const adjectives = doc.adjectives().json();
    adjectives.forEach((adj: any) => {
      if (adj.text.length > 2) {
        terms.add(adj.text.toLowerCase());
      }
    });
    
    return Array.from(terms);
  }

  private extractFilters(doc: any, query: string): SearchQuery['filters'] {
    const filters: SearchQuery['filters'] = {};
    const text = query.toLowerCase();
    
    // Location filters
    const places = this.extractPlaces(doc);
    if (places.length > 0) {
      filters.location = places[0];
    }
    
    // Person filters
    const people = this.extractPeople(doc);
    if (people.length > 0) {
      filters.person = people[0];
    }
    
    // Amount filters
    if (text.includes('expensive') || text.includes('costly')) {
      filters.amount = { min: 50 };
    }
    if (text.includes('cheap') || text.includes('budget')) {
      filters.amount = { max: 20 };
    }
    
    // Date filters
    if (text.includes('last week')) {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      filters.dateRange = { start: lastWeek.toISOString() };
    }
    if (text.includes('this month')) {
      const thisMonth = new Date();
      thisMonth.setDate(1);
      filters.dateRange = { start: thisMonth.toISOString() };
    }
    
    // Type filters
    const typeKeywords = {
      'temple': 'culture',
      'restaurant': 'food',
      'museum': 'culture',
      'hotel': 'accommodation',
      'flight': 'transport'
    };
    
    Object.entries(typeKeywords).forEach(([keyword, type]) => {
      if (text.includes(keyword)) {
        filters.type = type;
      }
    });
    
    return filters;
  }
}

export const nlpService = NLPService.getInstance();