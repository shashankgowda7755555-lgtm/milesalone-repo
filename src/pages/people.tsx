import { useState, useEffect } from 'react';
import { Plus, User, MapPin, Briefcase, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { database, Person } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { AIInteractionButton } from '@/components/ai-interaction-button';

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  const [newPerson, setNewPerson] = useState({
    name: '',
    contact: '',
    profession: '',
    interests: [] as string[],
    location: '',
    relationshipStrength: 3 as Person['relationshipStrength'],
    connectionSource: '',
    notes: '',
    tags: [] as string[],
  });

  useEffect(() => {
    loadPeople();
  }, []);

  const loadPeople = async () => {
    try {
      await database.init();
      const data = await database.getAll<Person>('people');
      setPeople(data);
    } catch (error) {
      console.error('Failed to load people:', error);
      toast({
        title: "Error",
        description: "Failed to load people",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddPerson = async () => {
    if (!newPerson.name.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide at least a name",
        variant: "destructive",
      });
      return;
    }

    try {
      const person: Person = {
        ...newPerson,
        id: crypto.randomUUID(),
        photos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await database.add('people', person);
      setPeople(prev => [person, ...prev]);
      setNewPerson({
        name: '',
        contact: '',
        profession: '',
        interests: [],
        location: '',
        relationshipStrength: 3,
        connectionSource: '',
        notes: '',
        tags: [],
      });
      setShowAddDialog(false);
      
      toast({
        title: "Person Added!",
        description: `${person.name} has been added to your contacts`,
      });
    } catch (error) {
      console.error('Failed to add person:', error);
      toast({
        title: "Error",
        description: "Failed to add person",
        variant: "destructive",
      });
    }
  };

  const getRelationshipColor = (strength: Person['relationshipStrength']) => {
    const colors = {
      1: 'text-muted-foreground',
      2: 'text-accent',
      3: 'text-primary',
      4: 'text-travel-culture',
      5: 'text-travel-food',
    };
    return colors[strength];
  };

  const getRelationshipLabel = (strength: Person['relationshipStrength']) => {
    const labels = {
      1: 'Just Met',
      2: 'Acquaintance', 
      3: 'Friend',
      4: 'Good Friend',
      5: 'Close Friend',
    };
    return labels[strength];
  };

  const handleArrayInput = (value: string, field: 'interests' | 'tags') => {
    const items = value.split(',').map(item => item.trim()).filter(Boolean);
    setNewPerson(prev => ({ ...prev, [field]: items }));
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
          <h1 className="text-3xl font-bold text-foreground">People Met</h1>
          <p className="text-muted-foreground">Your travel connections & relationships</p>
        </div>
        
        <div className="flex gap-2">
          <AIInteractionButton 
            context="people" 
            placeholder="Ask AI to add contacts, find people..."
          />
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="travel-button-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Person
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Contact</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  placeholder="David Smith"
                  value={newPerson.name}
                  onChange={(e) => setNewPerson(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="contact">Contact</Label>
                <Input
                  id="contact"
                  placeholder="david@example.com or +1234567890"
                  value={newPerson.contact}
                  onChange={(e) => setNewPerson(prev => ({ ...prev, contact: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="profession">Profession</Label>
                  <Input
                    id="profession"
                    placeholder="Software Engineer"
                    value={newPerson.profession}
                    onChange={(e) => setNewPerson(prev => ({ ...prev, profession: e.target.value }))}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="San Francisco, CA"
                    value={newPerson.location}
                    onChange={(e) => setNewPerson(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="relationship">Relationship Strength</Label>
                <Select 
                  value={newPerson.relationshipStrength.toString()} 
                  onValueChange={(value) => 
                    setNewPerson(prev => ({ ...prev, relationshipStrength: parseInt(value) as Person['relationshipStrength'] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Just Met</SelectItem>
                    <SelectItem value="2">2 - Acquaintance</SelectItem>
                    <SelectItem value="3">3 - Friend</SelectItem>
                    <SelectItem value="4">4 - Good Friend</SelectItem>
                    <SelectItem value="5">5 - Close Friend</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="connectionSource">How you met</Label>
                <Input
                  id="connectionSource"
                  placeholder="Tech conference, mutual friend, hostel..."
                  value={newPerson.connectionSource}
                  onChange={(e) => setNewPerson(prev => ({ ...prev, connectionSource: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="interests">Interests</Label>
                <Input
                  id="interests"
                  placeholder="photography, hiking, coding (comma-separated)"
                  value={newPerson.interests.join(', ')}
                  onChange={(e) => handleArrayInput(e.target.value, 'interests')}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes about this person..."
                  value={newPerson.notes}
                  onChange={(e) => setNewPerson(prev => ({ ...prev, notes: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="developer, traveler, entrepreneur (comma-separated)"
                  value={newPerson.tags.join(', ')}
                  onChange={(e) => handleArrayInput(e.target.value, 'tags')}
                />
              </div>

              <Button onClick={handleAddPerson} className="travel-button-primary">
                Add Person
              </Button>
            </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {([1, 2, 3, 4, 5] as const).map(strength => (
          <Card key={strength}>
            <CardContent className="p-4 text-center">
              <div className={`text-2xl font-bold ${getRelationshipColor(strength)}`}>
                {people.filter(p => p.relationshipStrength === strength).length}
              </div>
              <div className="text-xs text-muted-foreground">{getRelationshipLabel(strength)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* People Grid */}
      {people.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No people yet</h3>
            <p className="text-muted-foreground mb-4">
              Start adding people you meet during your travels!
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="travel-button-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Contact
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {people.map((person) => (
            <Card key={person.id} className="travel-card hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <User className={`h-5 w-5 ${getRelationshipColor(person.relationshipStrength)}`} />
                      {person.name}
                    </CardTitle>
                    <div className="flex flex-wrap gap-2 mt-1 text-sm text-muted-foreground">
                      {person.profession && (
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {person.profession}
                        </span>
                      )}
                      {person.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {person.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="flex items-center gap-1">
                        {Array.from({ length: person.relationshipStrength }).map((_, i) => (
                          <Heart key={i} className={`h-3 w-3 ${getRelationshipColor(person.relationshipStrength)} fill-current`} />
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {getRelationshipLabel(person.relationshipStrength)}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {person.contact && (
                  <div className="text-sm text-muted-foreground mb-2">
                    📧 {person.contact}
                  </div>
                )}

                {person.connectionSource && (
                  <div className="text-sm mb-3">
                    <span className="font-medium">Met: </span>
                    {person.connectionSource}
                  </div>
                )}
                
                {person.notes && (
                  <p className="text-sm text-foreground mb-3">{person.notes}</p>
                )}

                {person.interests.length > 0 && (
                  <div className="mb-3">
                    <div className="text-xs text-muted-foreground mb-1">Interests:</div>
                    <div className="flex flex-wrap gap-1">
                      {person.interests.map((interest, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {interest}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {person.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {person.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                <div className="text-xs text-muted-foreground mt-3 pt-3 border-t">
                  Added {new Date(person.createdAt).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}