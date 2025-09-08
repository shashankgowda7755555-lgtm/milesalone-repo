import { useState, useEffect } from 'react';
import { Plus, Search, BookOpen, Calendar, Smile, Frown, Meh, Star, Heart } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { database, JournalEntry } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { aiService } from '@/lib/ai-service';
import { AIInteractionButton } from '@/components/ai-interaction-button';

const moodIcons = {
  1: { icon: Frown, color: 'text-red-500', label: 'Terrible' },
  2: { icon: Frown, color: 'text-orange-500', label: 'Bad' },
  3: { icon: Meh, color: 'text-yellow-500', label: 'Okay' },
  4: { icon: Smile, color: 'text-green-500', label: 'Good' },
  5: { icon: Heart, color: 'text-pink-500', label: 'Amazing' },
};

export default function JournalPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newEntry, setNewEntry] = useState<Partial<JournalEntry>>({
    title: '',
    content: '',
    mood: 3,
    weather: '',
    location: '',
    tags: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadEntries();
    // Initialize database
    database.init();
  }, []);

  const loadEntries = async () => {
    try {
      const data = await database.getAll<JournalEntry>('journalEntries');
      setEntries(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading entries:', error);
      toast({
        title: "Error",
        description: "Failed to load journal entries",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newEntry.title?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title",
        variant: "destructive",
      });
      return;
    }

    try {
      // Auto-enhance with AI
      let tags = newEntry.tags || [];
      if (newEntry.content && newEntry.content.length > 20) {
        try {
          const suggestions = await aiService.autoTag(newEntry.content, { type: 'journal' });
          if (Array.isArray(suggestions.result)) {
            tags = [...new Set([...tags, ...suggestions.result])];
          }
        } catch (error) {
          console.log('AI enhancement failed, continuing without');
        }
      }

      const entry: JournalEntry = {
        id: Date.now().toString(),
        title: newEntry.title,
        content: newEntry.content || '',
        mood: newEntry.mood,
        weather: newEntry.weather,
        location: newEntry.location,
        photos: [],
        tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await database.add('journalEntries', entry);
      setEntries([entry, ...entries]);
      setNewEntry({ title: '', content: '', mood: 3, weather: '', location: '', tags: [] });
      setIsModalOpen(false);
      
      toast({
        title: "Success",
        description: "Journal entry saved!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save entry",
        variant: "destructive",
      });
    }
  };

  const filteredEntries = entries.filter(entry =>
    entry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-travel p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="h-12 bg-muted rounded"></div>
            {[1,2,3].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-travel p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Journal</h1>
          </div>
          <div className="flex gap-2">
            <AIInteractionButton 
              context="journal" 
              placeholder="Ask AI to add journal entries, search memories..."
            />
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full h-12 w-12 p-0">
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>New Journal Entry</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={newEntry.title || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                    placeholder="What happened today?"
                  />
                </div>
                <div>
                  <Label htmlFor="content">Content</Label>
                  <Textarea
                    id="content"
                    value={newEntry.content || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
                    placeholder="Describe your experience..."
                    rows={6}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="mood">Mood</Label>
                    <Select value={newEntry.mood?.toString()} onValueChange={(value) => setNewEntry({ ...newEntry, mood: parseInt(value) as 1|2|3|4|5 })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(moodIcons).map(([value, { icon: Icon, label, color }]) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex items-center gap-2">
                              <Icon className={`h-4 w-4 ${color}`} />
                              <span>{label}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="weather">Weather</Label>
                    <Input
                      id="weather"
                      value={newEntry.weather || ''}
                      onChange={(e) => setNewEntry({ ...newEntry, weather: e.target.value })}
                      placeholder="Sunny, Rainy..."
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newEntry.location || ''}
                    onChange={(e) => setNewEntry({ ...newEntry, location: e.target.value })}
                    placeholder="Where were you?"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save Entry</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search journal entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 travel-input"
            />
          </div>
        </div>

        {/* Entries Grid */}
        <div className="space-y-4">
          {filteredEntries.length === 0 ? (
            <Card className="p-8 text-center glass-card">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? 'No matching entries' : 'No journal entries yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery 
                  ? 'Try different search terms or clear the search.' 
                  : 'Start documenting your travel experiences!'
                }
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Write First Entry
                </Button>
              )}
            </Card>
          ) : (
            filteredEntries.map((entry) => {
              const MoodIcon = moodIcons[entry.mood || 3]?.icon || Meh;
              const moodColor = moodIcons[entry.mood || 3]?.color || 'text-gray-500';
              
              return (
                <Card key={entry.id} className="p-6 glass-card hover:shadow-lg transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-semibold text-foreground">{entry.title}</h3>
                        {entry.mood && (
                          <MoodIcon className={`h-5 w-5 ${moodColor}`} />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{new Date(entry.createdAt).toLocaleDateString()}</span>
                        </div>
                        {entry.location && (
                          <span className="text-travel-adventure">📍 {entry.location}</span>
                        )}
                        {entry.weather && (
                          <span>🌤️ {entry.weather}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {entry.content && (
                    <p className="text-foreground/80 mb-4 line-clamp-3">
                      {entry.content}
                    </p>
                  )}
                  
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}