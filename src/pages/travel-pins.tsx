import { useState, useEffect } from 'react';
import { Plus, MapPin, Star, Calendar, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { database, TravelPin } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { AIInteractionButton } from '@/components/ai-interaction-button';

export default function TravelPinsPage() {
  const [pins, setPins] = useState<TravelPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  const [newPin, setNewPin] = useState({
    title: '',
    description: '',
    location: '',
    status: 'wishlist' as TravelPin['status'],
    category: 'adventure' as TravelPin['category'],
    tags: [] as string[],
    notes: '',
  });

  useEffect(() => {
    loadPins();
  }, []);

  const loadPins = async () => {
    try {
      await database.init();
      const data = await database.getAll<TravelPin>('travelPins');
      setPins(data);
    } catch (error) {
      console.error('Failed to load travel pins:', error);
      toast({
        title: "Error",
        description: "Failed to load travel pins",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPin = async () => {
    if (!newPin.title.trim() || !newPin.location.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide at least a title and location",
        variant: "destructive",
      });
      return;
    }

    try {
      const pin: TravelPin = {
        ...newPin,
        id: crypto.randomUUID(),
        photos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await database.add('travelPins', pin);
      setPins(prev => [pin, ...prev]);
      setNewPin({
        title: '',
        description: '',
        location: '',
        status: 'wishlist',
        category: 'adventure',
        tags: [],
        notes: '',
      });
      setShowAddDialog(false);
      
      toast({
        title: "Pin Added!",
        description: `${pin.title} has been added to your travel pins`,
      });
    } catch (error) {
      console.error('Failed to add pin:', error);
      toast({
        title: "Error",
        description: "Failed to add travel pin",
        variant: "destructive",
      });
    }
  };

  const updatePinStatus = async (id: string, status: TravelPin['status']) => {
    try {
      const pin = pins.find(p => p.id === id);
      if (!pin) return;

      const updatedPin = {
        ...pin,
        status,
        updatedAt: new Date().toISOString(),
        ...(status === 'visited' && { visitDate: new Date().toISOString() }),
      };

      await database.update('travelPins', updatedPin);
      setPins(prev => prev.map(p => p.id === id ? updatedPin : p));
      
      toast({
        title: "Status Updated",
        description: `${pin.title} marked as ${status}`,
      });
    } catch (error) {
      console.error('Failed to update pin:', error);
    }
  };

  const getStatusColor = (status: TravelPin['status']) => {
    const colors = {
      wishlist: 'bg-muted text-muted-foreground',
      planned: 'bg-accent text-accent-foreground',
      visited: 'bg-primary text-primary-foreground',
      favorite: 'bg-travel-food text-white',
    };
    return colors[status];
  };

  const getCategoryColor = (category: TravelPin['category']) => {
    const colors = {
      adventure: 'text-travel-adventure',
      culture: 'text-travel-culture',
      food: 'text-travel-food',
      nature: 'text-travel-nature',
      other: 'text-muted-foreground',
    };
    return colors[category];
  };

  const handleTagInput = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
    setNewPin(prev => ({ ...prev, tags }));
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
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Travel Pins</h1>
          <p className="text-muted-foreground">Places you want to explore</p>
        </div>
        
        <div className="flex gap-2">
          <AIInteractionButton 
            context="travel-pins" 
            placeholder="Ask AI to add places, update status..."
          />
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button className="travel-button-primary">
                <Plus className="h-4 w-4 mr-2" />
                Add Pin
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Add New Travel Pin</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  placeholder="Golden Temple"
                  value={newPin.title}
                  onChange={(e) => setNewPin(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="location">Location *</Label>
                <Input
                  id="location"
                  placeholder="Amritsar, Punjab, India"
                  value={newPin.location}
                  onChange={(e) => setNewPin(prev => ({ ...prev, location: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={newPin.status} onValueChange={(value: TravelPin['status']) => 
                    setNewPin(prev => ({ ...prev, status: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="wishlist">Wishlist</SelectItem>
                      <SelectItem value="planned">Planned</SelectItem>
                      <SelectItem value="visited">Visited</SelectItem>
                      <SelectItem value="favorite">Favorite</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newPin.category} onValueChange={(value: TravelPin['category']) => 
                    setNewPin(prev => ({ ...prev, category: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adventure">Adventure</SelectItem>
                      <SelectItem value="culture">Culture</SelectItem>
                      <SelectItem value="food">Food</SelectItem>
                      <SelectItem value="nature">Nature</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Beautiful Sikh temple with golden architecture..."
                  value={newPin.description}
                  onChange={(e) => setNewPin(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="temple, architecture, peaceful (comma-separated)"
                  value={newPin.tags.join(', ')}
                  onChange={(e) => handleTagInput(e.target.value)}
                />
              </div>

              <Button onClick={handleAddPin} className="travel-button-primary">
                Add Travel Pin
              </Button>
            </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {(['wishlist', 'planned', 'visited', 'favorite'] as const).map(status => (
          <Card key={status}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {pins.filter(p => p.status === status).length}
              </div>
              <div className="text-sm text-muted-foreground capitalize">{status}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Travel Pins Grid */}
      {pins.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No travel pins yet</h3>
            <p className="text-muted-foreground mb-4">
              Start adding places you want to visit or have been to!
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="travel-button-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Pin
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {pins.map((pin) => (
            <Card key={pin.id} className="travel-card hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <MapPin className={`h-5 w-5 ${getCategoryColor(pin.category)}`} />
                      {pin.title}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{pin.location}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge className={getStatusColor(pin.status)}>
                      {pin.status}
                    </Badge>
                    {pin.status === 'visited' && (
                      <Star className="h-4 w-4 text-yellow-500 ml-auto" />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {pin.description && (
                  <p className="text-sm text-foreground mb-3">{pin.description}</p>
                )}
                
                {pin.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {pin.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2 mt-4">
                  {pin.status !== 'planned' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePinStatus(pin.id, 'planned')}
                    >
                      <Calendar className="h-3 w-3 mr-1" />
                      Plan
                    </Button>
                  )}
                  {pin.status !== 'visited' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePinStatus(pin.id, 'visited')}
                    >
                      <MapPin className="h-3 w-3 mr-1" />
                      Visited
                    </Button>
                  )}
                  {pin.status !== 'favorite' && pin.status === 'visited' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePinStatus(pin.id, 'favorite')}
                    >
                      <Star className="h-3 w-3 mr-1" />
                      Favorite
                    </Button>
                  )}
                </div>

                <div className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                  Added {new Date(pin.createdAt).toLocaleDateString()}
                  {pin.visitDate && (
                    <span> • Visited {new Date(pin.visitDate).toLocaleDateString()}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}