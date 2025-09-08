import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, User, BookOpen, DollarSign, CheckSquare, GraduationCap, Utensils, Package, Sparkles, Brain } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { database } from '@/lib/database';
import { aiService } from '@/lib/ai-service';
import { enhancedSearch } from '@/lib/enhanced-search';
import { nlpService } from '@/lib/nlp-service';

interface SearchResult {
  id: string;
  title?: string;
  name?: string;
  description?: string;
  content?: string;
  _type: string;
  createdAt: string;
  tags: string[];
}

const getModuleIcon = (type: string) => {
  const iconMap = {
    travelPins: MapPin,
    people: User,
    journalEntries: BookOpen,
    expenses: DollarSign,
    checklistItems: CheckSquare,
    learningEntries: GraduationCap,
    foodEntries: Utensils,
    gearItems: Package,
  };
  
  return iconMap[type as keyof typeof iconMap] || Search;
};

const getModuleName = (type: string) => {
  const nameMap = {
    travelPins: 'Travel Pins',
    people: 'People',
    journalEntries: 'Journal',
    expenses: 'Expenses',
    checklistItems: 'Checklist',
    learningEntries: 'Learning',
    foodEntries: 'Food',
    gearItems: 'Gear',
  };
  
  return nameMap[type as keyof typeof nameMap] || type;
};

const getModuleColor = (type: string) => {
  const colorMap = {
    travelPins: 'text-travel-adventure',
    people: 'text-travel-culture',
    journalEntries: 'text-primary',
    expenses: 'text-travel-food',
    checklistItems: 'text-accent',
    learningEntries: 'text-travel-nature',
    foodEntries: 'text-travel-food',
    gearItems: 'text-muted-foreground',
  };
  
  return colorMap[type as keyof typeof colorMap] || 'text-foreground';
};

export function UniversalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [useAdvancedSearch, setUseAdvancedSearch] = useState(false);
  const [searchMode, setSearchMode] = useState<'basic' | 'fuzzy' | 'semantic'>('basic');
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize enhanced search
    enhancedSearch.initialize().catch(console.error);
  }, []);

  useEffect(() => {
    const handleSearch = async () => {
      if (query.trim().length < 2) {
        setResults([]);
        setShowResults(false);
        return;
      }

      setIsSearching(true);
      try {
        let searchResults: any[] = [];
        
        // Choose search method based on mode and query complexity
        if (query.length > 10 && (query.includes(' in ') || query.includes(' with ') || query.includes(' from '))) {
          // Use semantic search for complex queries
          setSearchMode('semantic');
          searchResults = await enhancedSearch.semanticSearch(query);
        } else if (query.length > 5) {
          // Use enhanced fuzzy search
          setSearchMode('fuzzy');
          searchResults = await enhancedSearch.search(query, { threshold: 0.3 });
        } else {
          // Use basic database search
          setSearchMode('basic');
          searchResults = await database.universalSearch(query);
        }
        
        // Enhance with AI if query is complex enough and we have results
        if (query.length > 8 && searchResults.length < 5) {
          try {
            const aiAnalysis = await aiService.enhancedSearch(query, searchResults.slice(0, 3));
            if (aiAnalysis.searchTerms && aiAnalysis.searchTerms.length > 0) {
              const enhancedResults = await enhancedSearch.search(aiAnalysis.searchTerms.join(' '));
              if (enhancedResults.length > searchResults.length) {
                searchResults = enhancedResults;
              }
            }
          } catch (error) {
            console.log('AI enhancement failed, using existing results');
          }
        }
        
        setResults(searchResults);
        setShowResults(true);
      } catch (error) {
        console.error('Search error:', error);
        // Fallback to basic search
        try {
          const basicResults = await database.universalSearch(query);
          setResults(basicResults);
          setShowResults(true);
        } catch (fallbackError) {
          console.error('Fallback search failed:', fallbackError);
        }
      } finally {
        setIsSearching(false);
      }
    };

    const debounceTimer = setTimeout(handleSearch, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl mx-auto">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          type="text"
          placeholder="Search everything... 'IT people in Pune', 'temples to visit', 'expensive meals'"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && setShowResults(true)}
          className="pl-10 pr-16 py-3 text-base travel-input border-2 focus:border-primary/50"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {searchMode === 'semantic' && (
            <div title="Semantic Search (NLP Enhanced)">
              <Brain className="text-blue-500 h-4 w-4" />
            </div>
          )}
          {searchMode === 'fuzzy' && query.length > 5 && (
            <div title="Fuzzy Search (AI Enhanced)">
              <Sparkles className="text-primary h-4 w-4" />
            </div>
          )}
          {isSearching && (
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
          )}
        </div>
      </div>

      {/* Search Results */}
      {showResults && (
        <Card className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto floating-card z-50">
          {results.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {query.length < 2 ? (
                "Start typing to search across all your travel data..."
              ) : (
                "No results found. Try different keywords or add some data first!"
              )}
            </div>
          ) : (
            <div className="p-2">
              <div className="text-xs text-muted-foreground p-2 border-b">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </div>
              {results.map((result) => {
                const Icon = getModuleIcon(result._type);
                return (
                  <div
                    key={`${result._type}-${result.id}`}
                    className="p-3 hover:bg-muted/50 cursor-pointer border-b border-border/50 last:border-b-0 transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`h-4 w-4 mt-1 ${getModuleColor(result._type)}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm truncate">
                            {result.title || result.name || 'Untitled'}
                          </h4>
                          <Badge variant="secondary" className="text-xs">
                            {getModuleName(result._type)}
                          </Badge>
                        </div>
                        {(result.description || result.content) && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {result.description || result.content}
                          </p>
                        )}
                        {result.tags && result.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {result.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {result.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{result.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}