import { useState, useEffect } from 'react';
import { Plus, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { database, GearItem } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { AIInteractionButton } from '@/components/ai-interaction-button';

export default function GearPage() {
  const [items, setItems] = useState<GearItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    category: 'other' as GearItem['category'],
    condition: 'good' as GearItem['condition'],
    tags: [] as string[],
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      await database.init();
      const data = await database.getAll<GearItem>('gearItems');
      setItems(data);
    } catch (error) {
      console.error('Failed to load gear items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide an item name",
        variant: "destructive",
      });
      return;
    }

    try {
      const item: GearItem = {
        ...newItem,
        id: crypto.randomUUID(),
        photos: [],
        files: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await database.add('gearItems', item);
      setItems(prev => [item, ...prev]);
      setNewItem({
        name: '',
        description: '',
        category: 'other',
        condition: 'good',
        tags: [],
      });
      setShowAddDialog(false);
      
      toast({
        title: "Gear Added!",
        description: `"${item.name}" added to your gear list`,
      });
    } catch (error) {
      console.error('Failed to add item:', error);
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
          <h1 className="text-3xl font-bold text-foreground">Travel Gear</h1>
          <p className="text-muted-foreground">Equipment & essentials inventory</p>
        </div>
        <div className="flex gap-2">
          <AIInteractionButton 
            context="gear" 
            placeholder="Ask AI to add gear items..."
          />
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="travel-button-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Gear
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Gear Item</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <Input
                  placeholder="Item name"
                  value={newItem.name}
                  onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                />
                <Button onClick={handleAddItem}>Add Gear Item</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      {items.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No gear items yet</h3>
            <p className="text-muted-foreground mb-4">Start cataloging your travel equipment!</p>
            <Button onClick={() => setShowAddDialog(true)} className="travel-button-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Item
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id} className="travel-card">
              <CardHeader>
                <CardTitle>{item.name}</CardTitle>
              </CardHeader>
              <CardContent>
                {item.description && <p>{item.description}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}