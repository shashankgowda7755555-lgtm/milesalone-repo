import { useState, useEffect } from 'react';
import { Plus, CheckSquare, Square, Trash2, Clock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { database, ChecklistItem } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { AIInteractionButton } from '@/components/ai-interaction-button';

export default function ChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  const [newItem, setNewItem] = useState({
    title: '',
    description: '',
    category: 'packing' as ChecklistItem['category'],
    priority: 'medium' as ChecklistItem['priority'],
    tags: [] as string[],
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      await database.init();
      const data = await database.getAll<ChecklistItem>('checklistItems');
      setItems(data);
    } catch (error) {
      console.error('Failed to load checklist items:', error);
      toast({
        title: "Error",
        description: "Failed to load checklist items",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title",
        variant: "destructive",
      });
      return;
    }

    try {
      const item: ChecklistItem = {
        ...newItem,
        id: crypto.randomUUID(),
        completed: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await database.add('checklistItems', item);
      setItems(prev => [item, ...prev]);
      setNewItem({
        title: '',
        description: '',
        category: 'packing',
        priority: 'medium',
        tags: [],
      });
      setShowAddDialog(false);
      
      toast({
        title: "Task Added!",
        description: `"${item.title}" added to your checklist`,
      });
    } catch (error) {
      console.error('Failed to add item:', error);
      toast({
        title: "Error",
        description: "Failed to add checklist item",
        variant: "destructive",
      });
    }
  };

  const toggleItemCompletion = async (id: string) => {
    try {
      const item = items.find(i => i.id === id);
      if (!item) return;

      const updatedItem = {
        ...item,
        completed: !item.completed,
        completedAt: !item.completed ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      };

      await database.update('checklistItems', updatedItem);
      setItems(prev => prev.map(i => i.id === id ? updatedItem : i));
      
      toast({
        title: updatedItem.completed ? "Task Completed!" : "Task Unchecked",
        description: `"${item.title}" ${updatedItem.completed ? 'marked as done' : 'unmarked'}`,
      });
    } catch (error) {
      console.error('Failed to update item:', error);
    }
  };

  const deleteItem = async (id: string) => {
    try {
      const item = items.find(i => i.id === id);
      await database.delete('checklistItems', id);
      setItems(prev => prev.filter(i => i.id !== id));
      
      toast({
        title: "Task Deleted",
        description: `"${item?.title}" removed from checklist`,
      });
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const getPriorityColor = (priority: ChecklistItem['priority']) => {
    const colors = {
      low: 'bg-muted text-muted-foreground',
      medium: 'bg-accent text-accent-foreground',
      high: 'bg-travel-food text-white',
    };
    return colors[priority];
  };

  const getCategoryColor = (category: ChecklistItem['category']) => {
    const colors = {
      packing: 'text-travel-adventure',
      travel: 'text-travel-culture',
      preparation: 'text-primary',
      other: 'text-muted-foreground',
    };
    return colors[category];
  };

  const handleTagInput = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
    setNewItem(prev => ({ ...prev, tags }));
  };

  const completedCount = items.filter(item => item.completed).length;
  const totalCount = items.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Checklists</h1>
          <p className="text-muted-foreground">Packing & travel preparation tasks</p>
        </div>
        
        <div className="flex gap-2">
          <AIInteractionButton 
            context="checklist" 
            placeholder="Ask AI to add tasks, manage checklist..."
          />
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="travel-button-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Add New Checklist Item</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Task *</Label>
                <Input
                  id="title"
                  placeholder="Pack passport"
                  value={newItem.title}
                  onChange={(e) => setNewItem(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newItem.category} onValueChange={(value: ChecklistItem['category']) => 
                    setNewItem(prev => ({ ...prev, category: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="packing">Packing</SelectItem>
                      <SelectItem value="travel">Travel</SelectItem>
                      <SelectItem value="preparation">Preparation</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select value={newItem.priority} onValueChange={(value: ChecklistItem['priority']) => 
                    setNewItem(prev => ({ ...prev, priority: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Additional details about this task..."
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="documents, essentials, electronics (comma-separated)"
                  value={newItem.tags.join(', ')}
                  onChange={(e) => handleTagInput(e.target.value)}
                />
              </div>

              <Button onClick={handleAddItem} className="travel-button-primary">
                Add Task
              </Button>
            </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Progress Overview */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Progress Overview</h3>
            <Badge variant="outline" className="text-sm">
              {completedCount}/{totalCount} completed
            </Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-2 mb-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300" 
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <div className="text-center text-sm text-muted-foreground">
            {completionPercentage}% Complete
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {(['packing', 'travel', 'preparation', 'other'] as const).map(category => (
          <Card key={category}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {items.filter(i => i.category === category).length}
              </div>
              <div className="text-sm text-muted-foreground capitalize">{category}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Checklist Items */}
      {items.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tasks yet</h3>
            <p className="text-muted-foreground mb-4">
              Start creating your travel preparation checklist!
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="travel-button-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Task
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {/* Incomplete Items */}
          <div>
            <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Clock className="h-5 w-5 text-accent" />
              To Do ({items.filter(i => !i.completed).length})
            </h3>
            <div className="grid gap-3">
              {items.filter(item => !item.completed).map((item) => (
                <Card key={item.id} className="travel-card">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={item.completed}
                        onCheckedChange={() => toggleItemCompletion(item.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-foreground">{item.title}</h4>
                          <div className="flex items-center gap-2">
                            <Badge className={getPriorityColor(item.priority)}>
                              {item.priority}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteItem(item.id)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                          <CheckSquare className={`h-4 w-4 ${getCategoryColor(item.category)}`} />
                          <span className="capitalize">{item.category}</span>
                        </div>

                        {item.description && (
                          <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                        )}

                        {item.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Completed Items */}
          {items.filter(i => i.completed).length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Completed ({items.filter(i => i.completed).length})
              </h3>
              <div className="grid gap-3">
                {items.filter(item => item.completed).map((item) => (
                  <Card key={item.id} className="travel-card opacity-75">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={item.completed}
                          onCheckedChange={() => toggleItemCompletion(item.id)}
                          className="mt-1"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-muted-foreground line-through">{item.title}</h4>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteItem(item.id)}
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {item.completedAt && (
                            <div className="text-xs text-muted-foreground">
                              Completed {new Date(item.completedAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}