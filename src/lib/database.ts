// Offline-first database service using IndexedDB
export interface TravelPin {
  id: string;
  title: string;
  description?: string;
  location: string;
  coordinates?: { lat: number; lng: number };
  status: 'wishlist' | 'planned' | 'visited' | 'favorite';
  category: 'adventure' | 'culture' | 'food' | 'nature' | 'other';
  tags: string[];
  photos: string[];
  visitDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Person {
  id: string;
  name: string;
  contact?: string;
  profession?: string;
  interests: string[];
  location?: string;
  photos: string[];
  relationshipStrength: 1 | 2 | 3 | 4 | 5;
  connectionSource?: string;
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood?: 1 | 2 | 3 | 4 | 5;
  weather?: string;
  location?: string;
  photos: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category: 'food' | 'transport' | 'accommodation' | 'entertainment' | 'shopping' | 'other';
  location?: string;
  receipt?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  completedAt?: string;
  category: 'packing' | 'travel' | 'preparation' | 'other';
  priority: 'low' | 'medium' | 'high';
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface LearningEntry {
  id: string;
  title: string;
  description?: string;
  category: 'language' | 'skill' | 'culture' | 'other';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  progress: number; // 0-100
  notes?: string;
  completedAt?: string;
  photos: string[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FoodEntry {
  id: string;
  name: string;
  description?: string;
  location?: string;
  cuisine: 'local' | 'international' | 'street' | 'restaurant' | 'homemade';
  rating: 1 | 2 | 3 | 4 | 5;
  price?: string;
  photos: string[];
  notes?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface GearItem {
  id: string;
  name: string;
  description?: string;
  category: 'clothing' | 'electronics' | 'documents' | 'toiletries' | 'other';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  weight?: string;
  photos: string[];
  files: Array<{
    id: string;
    name: string;
    type: string;
    size: number;
    url: string;
    uploadedAt: string;
  }>;
  notes?: string;
  lastUsed?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

class TravelDatabase {
  private dbName = 'TravelCompanionDB';
  private version = 1;
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores for each module
        const stores = [
          'travelPins',
          'people',
          'journalEntries',
          'expenses',
          'checklistItems',
          'learningEntries',
          'foodEntries',
          'gearItems',
        ];

        stores.forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { keyPath: 'id' });
            store.createIndex('createdAt', 'createdAt');
            store.createIndex('tags', 'tags', { multiEntry: true });
            
            // Store-specific indexes
            if (storeName === 'travelPins') {
              store.createIndex('status', 'status');
              store.createIndex('category', 'category');
            }
            if (storeName === 'expenses') {
              store.createIndex('category', 'category');
              store.createIndex('amount', 'amount');
            }
          }
        });
      };
    });
  }

  // Generic CRUD operations
  async add<T extends { id: string }>(storeName: string, data: T): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.add(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async get<T>(storeName: string, id: string): Promise<T | null> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async update<T extends { id: string }>(storeName: string, data: T): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    
    const transaction = this.db.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Universal search across all modules
  async universalSearch(query: string): Promise<any[]> {
    const searchTerms = query.toLowerCase().split(' ');
    const results: any[] = [];

    const stores = [
      'travelPins',
      'people',
      'journalEntries',
      'expenses',
      'checklistItems',
      'learningEntries',
      'foodEntries',
      'gearItems',
    ];

    for (const storeName of stores) {
      const items = await this.getAll<any>(storeName);
      
      const filteredItems = items.filter((item: any) => {
        const searchableText = [
          item.title || '',
          item.name || '',
          item.description || '',
          item.content || '',
          item.location || '',
          item.notes || '',
          ...(Array.isArray(item.tags) ? item.tags : []),
        ].join(' ').toLowerCase();

        return searchTerms.some(term => searchableText.includes(term));
      });

      const itemsWithType = filteredItems.map(item => ({ 
        ...item, 
        _type: storeName,
        _searchScore: this.calculateSearchScore(item, searchTerms)
      }));
      
      results.push(...itemsWithType);
    }

    return results.sort((a, b) => {
      // Sort by search score first, then by date
      if (a._searchScore !== b._searchScore) {
        return b._searchScore - a._searchScore;
      }
      return new Date(b.updatedAt || b.createdAt).getTime() - 
             new Date(a.updatedAt || a.createdAt).getTime();
    });
  }

  private calculateSearchScore(item: any, searchTerms: string[]): number {
    let score = 0;
    const title = (item.title || item.name || '').toLowerCase();
    const description = (item.description || item.content || '').toLowerCase();
    
    searchTerms.forEach(term => {
      if (title.includes(term)) score += 3;
      if (description.includes(term)) score += 1;
      if (Array.isArray(item.tags) && item.tags.some((tag: string) => tag.toLowerCase().includes(term))) {
        score += 2;
      }
    });
    
    return score;
  }
}

export const database = new TravelDatabase();