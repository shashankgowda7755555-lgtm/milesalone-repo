import { aiService } from './ai-service';
import { database, TravelPin, Person, JournalEntry, Expense, ChecklistItem, LearningEntry, FoodEntry, GearItem } from './database';

interface CommandResponse {
  message: string;
  data?: any;
  action?: string;
}

class ConversationalAI {
  async processCommand(input: string): Promise<CommandResponse> {
    try {
      // First, let AI understand the intent and extract entities
      const analysis = await aiService.smartSuggestions(input, 'command-analysis', {
        modules: ['travel-pins', 'people', 'journal', 'expenses', 'checklist', 'learning', 'food', 'gear'],
        availableActions: ['add', 'get', 'update', 'delete', 'search', 'complete']
      });

      const { action, entity, data, query } = this.parseAnalysis(analysis.result || input);

      switch (action) {
        case 'add':
          return await this.handleAdd(entity, data, input);
        case 'get':
        case 'search':
          return await this.handleSearch(entity, query, input);
        case 'update':
          return await this.handleUpdate(entity, data, input);
        case 'complete':
          return await this.handleComplete(entity, data, input);
        default:
          return await this.handleGeneral(input);
      }
    } catch (error) {
      console.error('Conversational AI Error:', error);
      return {
        message: "I couldn't process that command. Could you try rephrasing it?",
      };
    }
  }

  private parseAnalysis(result: any): any {
    if (typeof result === 'string') {
      // Fallback parsing for plain text
      const input = result.toLowerCase();
      
      if (input.includes('add contact') || input.includes('add person')) {
        return { action: 'add', entity: 'person', data: this.extractPersonData(result) };
      }
      if (input.includes('get people') || input.includes('show people') || input.includes('find people')) {
        return { action: 'search', entity: 'people', query: this.extractLocationQuery(result) };
      }
      if (input.includes('add journey') || input.includes('add trip') || input.includes('add travel')) {
        return { action: 'add', entity: 'travel-pin', data: this.extractTravelData(result) };
      }
      if (input.includes('completed') || input.includes('finished')) {
        return { action: 'complete', entity: 'travel-pin', data: this.extractTravelData(result) };
      }
      
      return { action: 'general', query: result };
    }

    return result;
  }

  private extractPersonData(input: string): Partial<Person> {
    const nameMatch = input.match(/add (?:contact|person) (\w+)/i);
    const phoneMatch = input.match(/(\d{5,})/);
    const locationMatch = input.match(/(?:at|in|from) ([^,]+?)(?:,|$| works| he | she )/i);
    const professionMatch = input.match(/(?:works? (?:as|at)|is (?:a|an)) ([^,]+)/i);

    return {
      name: nameMatch?.[1] || 'Unknown',
      contact: phoneMatch?.[0] || '',
      location: locationMatch?.[1]?.trim() || '',
      profession: professionMatch?.[1]?.trim() || '',
      interests: [],
      photos: [],
      relationshipStrength: 3,
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private extractTravelData(input: string): Partial<TravelPin> {
    const locationMatch = input.match(/(?:to|at|in) ([^,]+?)(?:,|$| which | that )/i);
    const statusMatch = input.match(/(planned|completed|visited|wishlist)/i);

    return {
      title: locationMatch?.[1]?.trim() || 'Travel Destination',
      location: locationMatch?.[1]?.trim() || '',
      status: (statusMatch?.[1]?.toLowerCase() as any) || 'planned',
      category: 'other',
      tags: [],
      photos: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  private extractLocationQuery(input: string): string {
    const locationMatch = input.match(/(?:in|at|from|working in) ([^,]+)/i);
    return locationMatch?.[1]?.trim() || '';
  }

  private async handleAdd(entity: string, data: any, originalInput: string): Promise<CommandResponse> {
    try {
      switch (entity) {
        case 'person':
          const personId = crypto.randomUUID();
          const person: Person = {
            id: personId,
            ...data
          };
          await database.add('people', person);
          return {
            message: `✅ Added contact: ${person.name}${person.contact ? ` (${person.contact})` : ''}${person.location ? ` at ${person.location}` : ''}`,
            data: person,
            action: 'person_added'
          };

        case 'travel-pin':
          const pinId = crypto.randomUUID();
          const pin: TravelPin = {
            id: pinId,
            ...data
          };
          await database.add('travelPins', pin);
          return {
            message: `✅ Added travel destination: ${pin.title} (${pin.status})`,
            data: pin,
            action: 'travel_pin_added'
          };

        default:
          // Use AI to understand what to add
          const addSuggestion = await aiService.smartSuggestions(originalInput, 'auto-add', {
            availableModules: ['journal', 'expenses', 'checklist', 'learning', 'food', 'gear']
          });
          
          return {
            message: `I understood you want to add something, but I need more specific information. ${addSuggestion.result || 'Could you be more specific?'}`,
          };
      }
    } catch (error) {
      return {
        message: `❌ Failed to add ${entity}. Please try again.`,
      };
    }
  }

  private async handleSearch(entity: string, query: string, originalInput: string): Promise<CommandResponse> {
    try {
      switch (entity) {
        case 'people':
          const people = await database.getAll<Person>('people');
          let filteredPeople = people;

          if (query) {
            filteredPeople = people.filter(person => 
              person.location?.toLowerCase().includes(query.toLowerCase()) ||
              person.profession?.toLowerCase().includes(query.toLowerCase()) ||
              person.name.toLowerCase().includes(query.toLowerCase())
            );
          }

          if (filteredPeople.length === 0) {
            return {
              message: query ? `No people found matching "${query}"` : "No contacts found.",
            };
          }

          const peopleList = filteredPeople.map(person => 
            `• ${person.name}${person.contact ? ` (${person.contact})` : ''}${person.location ? ` - ${person.location}` : ''}${person.profession ? ` | ${person.profession}` : ''}`
          ).join('\n');

          return {
            message: `Found ${filteredPeople.length} people:\n\n${peopleList}`,
            data: filteredPeople,
            action: 'people_retrieved'
          };

        case 'travel-pins':
          const pins = await database.getAll<TravelPin>('travelPins');
          const filteredPins = query ? 
            pins.filter(pin => 
              pin.location.toLowerCase().includes(query.toLowerCase()) ||
              pin.title.toLowerCase().includes(query.toLowerCase())
            ) : pins;

          if (filteredPins.length === 0) {
            return { message: "No travel destinations found." };
          }

          const pinsList = filteredPins.map(pin => 
            `• ${pin.title} (${pin.location}) - ${pin.status}`
          ).join('\n');

          return {
            message: `Found ${filteredPins.length} destinations:\n\n${pinsList}`,
            data: filteredPins,
            action: 'travel_pins_retrieved'
          };

        default:
          // Universal search across all modules
          const results = await database.universalSearch(query || originalInput);
          
          if (results.length === 0) {
            return { message: "No results found for your search." };
          }

          const resultsList = results.slice(0, 10).map(result => 
            `• ${result.title || result.name} (${result._type}) - ${result.description || result.content || 'No description'}`
          ).join('\n');

          return {
            message: `Found ${results.length} results:\n\n${resultsList}`,
            data: results,
            action: 'universal_search'
          };
      }
    } catch (error) {
      return {
        message: "❌ Search failed. Please try again.",
      };
    }
  }

  private async handleUpdate(entity: string, data: any, originalInput: string): Promise<CommandResponse> {
    return {
      message: "Update functionality is being implemented. Please use the specific module pages for now.",
    };
  }

  private async handleComplete(entity: string, data: any, originalInput: string): Promise<CommandResponse> {
    try {
      if (entity === 'travel-pin') {
        const pins = await database.getAll<TravelPin>('travelPins');
        const location = data.location || data.title;
        
        // Find the pin to complete
        const pinToComplete = pins.find(pin => 
          pin.location.toLowerCase().includes(location.toLowerCase()) ||
          pin.title.toLowerCase().includes(location.toLowerCase())
        );

        if (pinToComplete) {
          pinToComplete.status = 'visited';
          pinToComplete.updatedAt = new Date().toISOString();
          await database.update('travelPins', pinToComplete);

          // Find next planned destination
          const plannedPins = pins
            .filter(pin => pin.status === 'planned' && pin.visitDate)
            .sort((a, b) => new Date(a.visitDate!).getTime() - new Date(b.visitDate!).getTime());

          const nextDestination = plannedPins[0];

          let response = `✅ Marked ${pinToComplete.title} as visited!`;
          
          if (nextDestination) {
            response += `\n\n🗺️ Your next planned destination: ${nextDestination.title} (${nextDestination.location})`;
            if (nextDestination.visitDate) {
              const visitDate = new Date(nextDestination.visitDate);
              const today = new Date();
              const tomorrow = new Date(today);
              tomorrow.setDate(today.getDate() + 1);

              if (visitDate.toDateString() === today.toDateString()) {
                response += ' - Expected arrival: Today';
              } else if (visitDate.toDateString() === tomorrow.toDateString()) {
                response += ' - Expected arrival: Tomorrow';
              } else {
                response += ` - Expected arrival: ${visitDate.toLocaleDateString()}`;
              }
            }
          }

          return {
            message: response,
            data: { completed: pinToComplete, next: nextDestination },
            action: 'travel_completed'
          };
        }
      }

      return {
        message: `I couldn't find the item to mark as complete. Please be more specific.`,
      };
    } catch (error) {
      return {
        message: "❌ Failed to mark as complete. Please try again.",
      };
    }
  }

  private async handleGeneral(input: string): Promise<CommandResponse> {
    try {
      // Use AI to provide general assistance
      const response = await aiService.getInsights(input, {
        context: 'travel_companion',
        capabilities: [
          'Add contacts, travel destinations, journal entries',
          'Search across all your travel data',
          'Track progress and completion',
          'Provide travel insights and suggestions'
        ]
      });

      return {
        message: response.result || "I'm here to help with your travel data. You can ask me to add contacts, search for people or places, mark destinations as complete, and more!",
      };
    } catch (error) {
      return {
        message: "I'm your travel companion AI. Try asking me to:\n• Add contacts: 'add contact John 123456 at Mumbai'\n• Search people: 'show me people in Delhi'\n• Mark journeys complete: 'completed trip to Goa'\n• Add destinations: 'add trip to Rishikesh'",
      };
    }
  }
}

export const conversationalAI = new ConversationalAI();