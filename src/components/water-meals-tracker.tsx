import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Droplet, Utensils } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface DailyTracker {
  date: string;
  water: number;
  meals: {
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
  };
}

export function WaterMealsTracker() {
  const [tracker, setTracker] = useState<DailyTracker>({
    date: new Date().toDateString(),
    water: 0,
    meals: {
      breakfast: false,
      lunch: false,
      dinner: false
    }
  });

  // Load today's data from localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem(`daily-tracker-${today}`);
    if (stored) {
      setTracker(JSON.parse(stored));
    } else {
      setTracker({
        date: today,
        water: 0,
        meals: { breakfast: false, lunch: false, dinner: false }
      });
    }
  }, []);

  // Save data to localStorage
  useEffect(() => {
    localStorage.setItem(`daily-tracker-${tracker.date}`, JSON.stringify(tracker));
  }, [tracker]);

  const addWater = () => {
    if (tracker.water < 8) {
      setTracker(prev => ({ ...prev, water: prev.water + 1 }));
    }
  };

  const removeWater = () => {
    if (tracker.water > 0) {
      setTracker(prev => ({ ...prev, water: prev.water - 1 }));
    }
  };

  const toggleMeal = (meal: keyof typeof tracker.meals) => {
    setTracker(prev => ({
      ...prev,
      meals: {
        ...prev.meals,
        [meal]: !prev.meals[meal]
      }
    }));
  };

  const waterGlasses = Array.from({ length: 8 }, (_, i) => (
    <Button
      key={i}
      variant="ghost"
      size="sm"
      className={`w-8 h-8 p-0 rounded-full ${
        i < tracker.water 
          ? 'bg-blue-500 hover:bg-blue-600 text-white' 
          : 'bg-muted hover:bg-muted/80'
      }`}
      onClick={i < tracker.water ? removeWater : addWater}
    >
      <Droplet className="h-4 w-4" />
    </Button>
  ));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Water Tracker */}
      <Card className="p-4 glass-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Droplet className="h-5 w-5 text-blue-500" />
            <h3 className="font-semibold text-foreground">Water</h3>
          </div>
          <Badge variant="outline" className="text-xs">
            {tracker.water}/8 glasses
          </Badge>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {waterGlasses}
        </div>
        <div className="mt-3 text-xs text-muted-foreground text-center">
          Tap to add/remove glasses
        </div>
      </Card>

      {/* Meals Tracker */}
      <Card className="p-4 glass-card">
        <div className="flex items-center gap-2 mb-3">
          <Utensils className="h-5 w-5 text-travel-food" />
          <h3 className="font-semibold text-foreground">Meals</h3>
        </div>
        <div className="space-y-2">
          {Object.entries(tracker.meals).map(([meal, completed]) => (
            <Button
              key={meal}
              variant="ghost"
              className={`w-full justify-start text-sm ${
                completed 
                  ? 'bg-green-500/20 text-green-700 dark:text-green-300 hover:bg-green-500/30' 
                  : 'hover:bg-muted/60'
              }`}
              onClick={() => toggleMeal(meal as keyof typeof tracker.meals)}
            >
              <div className={`w-4 h-4 rounded border-2 mr-3 ${
                completed 
                  ? 'bg-green-500 border-green-500' 
                  : 'border-muted-foreground'
              }`}>
                {completed && (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>
                )}
              </div>
              {meal.charAt(0).toUpperCase() + meal.slice(1)}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  );
}