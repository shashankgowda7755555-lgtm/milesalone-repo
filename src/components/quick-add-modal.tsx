import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { database } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { aiService } from '@/lib/ai-service';

interface QuickAddModalProps {
  type: string;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickAddModal({ type, isOpen, onClose }: QuickAddModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleAutoEnhance = async (field: string, value: string) => {
    if (!value.trim()) return;
    
    try {
      // Auto-suggest tags based on content
      const suggestions = await aiService.smartSuggestions(value, 'auto-tag', { type });
      if (Array.isArray(suggestions.result)) {
        const newTags = suggestions.result.filter((tag: string) => !tags.includes(tag));
        setTags([...tags, ...newTags.slice(0, 3)]);
      }
    } catch (error) {
      console.log('Auto-enhance failed, continuing without AI');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const baseData = {
        id: Date.now().toString(),
        ...formData,
        tags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      let storeName = '';
      let data = { ...baseData };

      switch (type) {
        case 'journal':
          storeName = 'journalEntries';
          data = { ...data, title: formData.title || 'Journal Entry', content: formData.content || '', photos: [] };
          break;
        case 'person':
          storeName = 'people';
          data = { ...data, name: formData.name || '', interests: formData.interests?.split(',').map((i: string) => i.trim()) || [], photos: [], relationshipStrength: 3 };
          break;
        case 'expense':
          storeName = 'expenses';
          data = { ...data, description: formData.description || '', amount: parseFloat(formData.amount) || 0, currency: formData.currency || 'USD', category: formData.category || 'other' };
          break;
        case 'pin':
          storeName = 'travelPins';
          data = { ...data, title: formData.title || '', description: formData.description || '', location: formData.location || '', status: formData.status || 'wishlist', category: formData.category || 'other', photos: [] };
          break;
        case 'checklist':
          storeName = 'checklistItems';
          data = { ...data, title: formData.title || '', description: formData.description || '', completed: false, category: formData.category || 'other' };
          break;
        case 'learning':
          storeName = 'learningEntries';
          data = { ...data, title: formData.title || '', description: formData.description || '', type: formData.type || 'other', progress: 0, photos: [] };
          break;
        case 'food':
          storeName = 'foodEntries';
          data = { ...data, name: formData.name || '', cuisine: formData.cuisine || '', photos: [] };
          break;
        case 'gear':
          storeName = 'gearItems';
          data = { ...data, name: formData.name || '', category: formData.category || 'other', photos: [] };
          break;
      }

      await database.add(storeName, data);
      
      toast({
        title: "Added successfully!",
        description: `${type.charAt(0).toUpperCase() + type.slice(1)} has been saved.`,
      });

      onClose();
      setFormData({});
      setTags([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderFormFields = () => {
    switch (type) {
      case 'journal':
        return (
          <>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="What happened today?"
              />
            </div>
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content || ''}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                onBlur={(e) => handleAutoEnhance('content', e.target.value)}
                placeholder="Describe your experience..."
                rows={4}
              />
            </div>
          </>
        );
      
      case 'person':
        return (
          <>
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Person's name"
              />
            </div>
            <div>
              <Label htmlFor="profession">Profession</Label>
              <Input
                id="profession"
                value={formData.profession || ''}
                onChange={(e) => setFormData({ ...formData, profession: e.target.value })}
                placeholder="What do they do?"
              />
            </div>
            <div>
              <Label htmlFor="interests">Interests (comma-separated)</Label>
              <Input
                id="interests"
                value={formData.interests || ''}
                onChange={(e) => setFormData({ ...formData, interests: e.target.value })}
                onBlur={(e) => handleAutoEnhance('interests', e.target.value)}
                placeholder="photography, travel, tech..."
              />
            </div>
          </>
        );

      case 'expense':
        return (
          <>
            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What did you spend on?"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  value={formData.amount || ''}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency || 'USD'} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="INR">INR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="transport">Transport</SelectItem>
                  <SelectItem value="accommodation">Accommodation</SelectItem>
                  <SelectItem value="entertainment">Entertainment</SelectItem>
                  <SelectItem value="shopping">Shopping</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        );

      case 'pin':
        return (
          <>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Place name"
              />
            </div>
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location || ''}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="City, Country"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wishlist">Wishlist</SelectItem>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="visited">Visited</SelectItem>
                    <SelectItem value="favorite">Favorite</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
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
          </>
        );

      default:
        return (
          <>
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title || formData.name || ''}
                onChange={(e) => setFormData({ ...formData, [type === 'food' || type === 'gear' ? 'name' : 'title']: e.target.value })}
                placeholder={`${type.charAt(0).toUpperCase() + type.slice(1)} name`}
              />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                onBlur={(e) => handleAutoEnhance('description', e.target.value)}
                placeholder="Add details..."
                rows={3}
              />
            </div>
          </>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add {type.charAt(0).toUpperCase() + type.slice(1)}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {renderFormFields()}
          
          {/* Tags Section */}
          <div>
            <Label htmlFor="tags">Tags</Label>
            <div className="flex gap-2 mb-2">
              <Input
                id="tags"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Add tags..."
                className="flex-1"
              />
              <Button type="button" onClick={addTag} size="sm">Add</Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                  <X
                    className="h-3 w-3 ml-1 cursor-pointer hover:text-destructive"
                    onClick={() => removeTag(tag)}
                  />
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}