import { useState, useEffect } from 'react';
import { Plus, GraduationCap, BookOpen, Target, Trophy, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { database, LearningEntry } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { AIInteractionButton } from '@/components/ai-interaction-button';

export default function LearningPage() {
  const [entries, setEntries] = useState<LearningEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();

  const [newEntry, setNewEntry] = useState({
    title: '',
    description: '',
    category: 'language' as LearningEntry['category'],
    difficulty: 'beginner' as LearningEntry['difficulty'],
    progress: 0,
    notes: '',
    tags: [] as string[],
  });

  useEffect(() => {
    loadEntries();
  }, []);

  const loadEntries = async () => {
    try {
      await database.init();
      const data = await database.getAll<LearningEntry>('learningEntries');
      setEntries(data);
    } catch (error) {
      console.error('Failed to load learning entries:', error);
      toast({
        title: "Error",
        description: "Failed to load learning entries",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!newEntry.title.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide a title",
        variant: "destructive",
      });
      return;
    }

    try {
      const entry: LearningEntry = {
        ...newEntry,
        id: crypto.randomUUID(),
        photos: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await database.add('learningEntries', entry);
      setEntries(prev => [entry, ...prev]);
      setNewEntry({
        title: '',
        description: '',
        category: 'language',
        difficulty: 'beginner',
        progress: 0,
        notes: '',
        tags: [],
      });
      setShowAddDialog(false);
      
      toast({
        title: "Learning Goal Added!",
        description: `"${entry.title}" added to your learning tracker`,
      });
    } catch (error) {
      console.error('Failed to add entry:', error);
      toast({
        title: "Error",
        description: "Failed to add learning entry",
        variant: "destructive",
      });
    }
  };

  const updateProgress = async (id: string, progress: number) => {
    try {
      const entry = entries.find(e => e.id === id);
      if (!entry) return;

      const updatedEntry = {
        ...entry,
        progress,
        updatedAt: new Date().toISOString(),
        ...(progress === 100 && { completedAt: new Date().toISOString() }),
      };

      await database.update('learningEntries', updatedEntry);
      setEntries(prev => prev.map(e => e.id === id ? updatedEntry : e));
      
      if (progress === 100) {
        toast({
          title: "🎉 Learning Goal Completed!",
          description: `Congratulations on completing "${entry.title}"!`,
        });
      } else {
        toast({
          title: "Progress Updated",
          description: `"${entry.title}" is now ${progress}% complete`,
        });
      }
    } catch (error) {
      console.error('Failed to update progress:', error);
    }
  };

  const getDifficultyColor = (difficulty: LearningEntry['difficulty']) => {
    const colors = {
      beginner: 'bg-travel-nature/20 text-travel-nature',
      intermediate: 'bg-accent/20 text-accent',
      advanced: 'bg-travel-food/20 text-travel-food',
    };
    return colors[difficulty];
  };

  const getCategoryIcon = (category: LearningEntry['category']) => {
    const icons = {
      language: GraduationCap,
      skill: Target,
      culture: BookOpen,
      other: Trophy,
    };
    return icons[category];
  };

  const getCategoryColor = (category: LearningEntry['category']) => {
    const colors = {
      language: 'text-travel-culture',
      skill: 'text-primary',
      culture: 'text-travel-adventure',
      other: 'text-muted-foreground',
    };
    return colors[category];
  };

  const handleTagInput = (value: string) => {
    const tags = value.split(',').map(tag => tag.trim()).filter(Boolean);
    setNewEntry(prev => ({ ...prev, tags }));
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return 'bg-red-500';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const averageProgress = entries.length > 0 
    ? Math.round(entries.reduce((sum, entry) => sum + entry.progress, 0) / entries.length)
    : 0;

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
          <h1 className="text-3xl font-bold text-foreground">Learning Tracker</h1>
          <p className="text-muted-foreground">Skills & knowledge you're developing</p>
        </div>
        
        <div className="flex gap-2">
          <AIInteractionButton 
            context="learning" 
            placeholder="Ask AI to add learning goals, update progress..."
          />
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button className="travel-button-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md mx-auto">
            <DialogHeader>
              <DialogTitle>Add Learning Goal</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Goal *</Label>
                <Input
                  id="title"
                  placeholder="Learn Spanish basics"
                  value={newEntry.title}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newEntry.category} onValueChange={(value: LearningEntry['category']) => 
                    setNewEntry(prev => ({ ...prev, category: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="language">Language</SelectItem>
                      <SelectItem value="skill">Skill</SelectItem>
                      <SelectItem value="culture">Culture</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select value={newEntry.difficulty} onValueChange={(value: LearningEntry['difficulty']) => 
                    setNewEntry(prev => ({ ...prev, difficulty: value }))
                  }>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="progress">Initial Progress (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="0"
                  value={newEntry.progress}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, progress: parseInt(e.target.value) || 0 }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="What do you want to achieve?"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="conversation, grammar, travel (comma-separated)"
                  value={newEntry.tags.join(', ')}
                  onChange={(e) => handleTagInput(e.target.value)}
                />
              </div>

              <Button onClick={handleAddEntry} className="travel-button-primary">
                Add Learning Goal
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
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Overall Progress
            </h3>
            <Badge variant="outline" className="text-sm">
              {averageProgress}% Average
            </Badge>
          </div>
          <div className="w-full bg-muted rounded-full h-3 mb-2">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${getProgressColor(averageProgress)}`}
              style={{ width: `${averageProgress}%` }}
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{entries.filter(e => e.completedAt).length} completed</span>
            <span>{entries.length} total goals</span>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {(['language', 'skill', 'culture', 'other'] as const).map(category => (
          <Card key={category}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {entries.filter(e => e.category === category).length}
              </div>
              <div className="text-sm text-muted-foreground capitalize">{category}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Learning Entries */}
      {entries.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No learning goals yet</h3>
            <p className="text-muted-foreground mb-4">
              Start tracking skills and knowledge you want to develop!
            </p>
            <Button onClick={() => setShowAddDialog(true)} className="travel-button-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Goal
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {entries.map((entry) => {
            const CategoryIcon = getCategoryIcon(entry.category);
            return (
              <Card key={entry.id} className="travel-card hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CategoryIcon className={`h-5 w-5 ${getCategoryColor(entry.category)}`} />
                        {entry.title}
                        {entry.completedAt && <Trophy className="h-4 w-4 text-yellow-500" />}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getDifficultyColor(entry.difficulty)}>
                          {entry.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs capitalize">
                          {entry.category}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{entry.progress}%</div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {entry.description && (
                    <p className="text-sm text-muted-foreground mb-4">{entry.description}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{entry.progress}%</span>
                    </div>
                    <Progress value={entry.progress} className="h-2" />
                  </div>

                  {/* Progress Controls */}
                  <div className="flex gap-2 mb-4">
                    {[25, 50, 75, 100].map(value => (
                      <Button
                        key={value}
                        size="sm"
                        variant="outline"
                        onClick={() => updateProgress(entry.id, value)}
                        disabled={entry.progress >= value}
                        className="flex-1"
                      >
                        {value}%
                      </Button>
                    ))}
                  </div>

                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {entry.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {entry.notes && (
                    <div className="text-sm bg-muted/50 p-3 rounded-lg mb-3">
                      {entry.notes}
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground pt-3 border-t">
                    Started {new Date(entry.createdAt).toLocaleDateString()}
                    {entry.completedAt && (
                      <span> • Completed {new Date(entry.completedAt).toLocaleDateString()}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}