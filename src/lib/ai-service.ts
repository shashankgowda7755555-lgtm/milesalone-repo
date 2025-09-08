class AIService {
  private baseUrl = '/api/supabase/functions/v1';

  async enhancedSearch(query: string, context: any[] = []) {
    try {
      const response = await fetch(`${this.baseUrl}/ai-search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, context }),
      });

      if (!response.ok) {
        throw new Error('AI search failed');
      }

      const result = await response.json();
      return result.success ? result : result.fallback;
    } catch (error) {
      console.error('AI Search Error:', error);
      // Fallback to basic search
      return {
        searchTerms: [query],
        filters: {},
        suggestions: []
      };
    }
  }

  async smartSuggestions(input: string, type: string, context: any = {}) {
    try {
      // Use command-analysis for conversational commands
      const endpoint = type === 'command-analysis' ? 'command-analysis' : 'smart-suggestions';
      
      const response = await fetch(`${this.baseUrl}/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input, type, context }),
      });

      if (!response.ok) {
        throw new Error('Smart suggestions failed');
      }

      const result = await response.json();
      return result.success ? result : { result: result.fallback };
    } catch (error) {
      console.error('Smart Suggestions Error:', error);
      return { result: [] };
    }
  }

  async autoTag(content: string, context: any = {}) {
    return this.smartSuggestions(content, 'auto-tag', context);
  }

  async categorize(content: string, context: any = {}) {
    return this.smartSuggestions(content, 'categorize', context);
  }

  async extractEntities(content: string, context: any = {}) {
    return this.smartSuggestions(content, 'extract-entities', context);
  }

  async getInsights(content: string, context: any = {}) {
    return this.smartSuggestions(content, 'suggestions', context);
  }
}

export const aiService = new AIService();