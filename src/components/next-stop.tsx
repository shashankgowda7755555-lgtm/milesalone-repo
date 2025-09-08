import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Route } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { database, TravelPin } from '@/lib/database';

export function NextStop() {
  const [nextPin, setNextPin] = useState<TravelPin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNextStop();
  }, []);

  const loadNextStop = async () => {
    try {
      const pins = await database.getAll<TravelPin>('travelPins');
      const plannedPins = pins
        .filter(pin => pin.status === 'planned' && pin.visitDate)
        .sort((a, b) => new Date(a.visitDate!).getTime() - new Date(b.visitDate!).getTime());
      
      if (plannedPins.length > 0) {
        setNextPin(plannedPins[0]);
      }
    } catch (error) {
      console.error('Error loading next stop:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long',
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  if (loading) {
    return (
      <Card className="p-4 glass-card">
        <div className="animate-pulse">
          <div className="h-4 bg-muted rounded w-20 mb-2"></div>
          <div className="h-6 bg-muted rounded w-32 mb-1"></div>
          <div className="h-4 bg-muted rounded w-24"></div>
        </div>
      </Card>
    );
  }

  if (!nextPin) {
    return (
      <Card className="p-4 glass-card">
        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-5 w-5 text-travel-adventure" />
          <h3 className="font-semibold text-foreground">Next Stop</h3>
        </div>
        <p className="text-muted-foreground text-sm">
          No upcoming trips planned. Add some travel pins to get started!
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 glass-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-travel-adventure" />
          <h3 className="font-semibold text-foreground">Next Stop</h3>
        </div>
        <Badge variant="secondary" className="text-xs">
          {nextPin.status.charAt(0).toUpperCase() + nextPin.status.slice(1)}
        </Badge>
      </div>
      
      <h4 className="font-bold text-lg text-foreground mb-1">
        {nextPin.title}
      </h4>
      
      <div className="flex items-center gap-1 text-muted-foreground text-sm mb-3">
        <Calendar className="h-4 w-4" />
        <span>Expected arrival: {formatDate(nextPin.visitDate!)}</span>
      </div>

      {nextPin.description && (
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {nextPin.description}
        </p>
      )}

      <div className="flex justify-between items-center">
        <div className="flex gap-1">
          {nextPin.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <Button size="sm" variant="ghost" className="text-xs">
          <Route className="h-3 w-3 mr-1" />
          View on map
        </Button>
      </div>
    </Card>
  );
}