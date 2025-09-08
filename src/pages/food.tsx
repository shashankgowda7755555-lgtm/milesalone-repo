import { useState, useEffect } from 'react';
import { Plus, Utensils, Star, MapPin, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { database, FoodEntry } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { AIInteractionButton } from '@/components/ai-interaction-button';

export default function FoodPage() {
  const [entries, setEntries] = useState<FoodEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  const [newEntry, setNewEntry] = useState({
    name: '',
    description: '',
    location: '',
    cuisine: 'local' as FoodEntry['cuisine'],
    rating: 3 as FoodEntry['rating'],
    price: '',
    notes: '',
    tags: [] as string[],
  });

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      await database.init();
      const data = await database.getAll<FoodEntry>('foodEntries');
      setEntries(data);
    } catch (error) {
      console.error('Failed to load food entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a food name",
        variant: "destructive",
      });
      return;
    }

    try {
      const entry: FoodEntry = {
        ...newEntry,
        id: crypto.randomUUID(),
        photos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await database.add('foodEntries', entry);
      setEntries(prev => [entry, ...prev]);
      setNewEntry({
        name: '',
        description: '',
        location: '',
        cuisine: 'local',
        rating: 3,
        price: '',
        notes: '',
        tags: [],
      });
      setShowAddDialog(false);
      
      toast({
        title: "Food Added!",
        description: `"${entry.name}" added to your food diary`,
      });
    } catch (error) {
      console.error('Failed to add entry:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Food Diary</h1>
          <p className="text-muted-foreground">Culinary adventures & discoveries</p>
        </div>
        <div className="flex gap-2">
          <AIInteractionButton 
            context="food" 
            placeholder="Ask AI to add food entries..."
          />
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="travel-button-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Food
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Food Experience</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  placeholder="Food name"
                  value={newEntry.name}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, name: e.target.value }))}
                />
                <Button onClick={handleAddEntry}>Add Food Entry</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {entries.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Utensils className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No food entries yet</h3>
            <p className="text-muted-foreground mb-4">Start documenting your culinary adventures!</p>
            <Button onClick={() => setShowAddDialog(true)} className="travel-button-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Food
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <Card key={entry.id} className="travel-card">
              <CardHeader>
                <CardTitle>{entry.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {entry.description && <p>{entry.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}