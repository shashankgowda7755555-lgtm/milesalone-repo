import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Users, 
  BookOpen, 
  DollarSign, 
  CheckSquare, 
  GraduationCap, 
  Utensils, 
  Package,
  Compass,
  TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { UniversalSearch } from '@/components/universal-search';
import { database } from '@/lib/database';

interface ModuleStats {
  travelPins: number;
  people: number;
  journalEntries: number;
  expenses: number;
  checklistItems: number;
  learningEntries: number;
  foodEntries: number;
  gearItems: number;
}

const modules = [
  {
    id: 'pins',
    name: 'Travel Pins',
    description: 'Places to visit & memories',
    icon: MapPin,
    path: '/pins',
    color: 'text-travel-adventure',
    gradient: 'gradient-adventure'
  },
  {
    id: 'people',
    name: 'People Met',
    description: 'Connections & relationships',
    icon: Users,
    path: '/people',
    color: 'text-travel-culture',
    gradient: 'gradient-sky'
  },
  {
    id: 'journal',
    name: 'Journal',
    description: 'Thoughts & experiences',
    icon: BookOpen,
    path: '/journal',
    color: 'text-primary',
    gradient: 'gradient-sunset'
  },
  {
    id: 'expenses',
    name: 'Budget',
    description: 'Track spending & costs',
    icon: DollarSign,
    path: '/expenses',
    color: 'text-travel-food',
    gradient: 'gradient-earth'
  },
  {
    id: 'checklist',
    name: 'Checklists',
    description: 'Packing & to-do lists',
    icon: CheckSquare,
    path: '/checklist',
    color: 'text-accent',
    gradient: 'gradient-sky'
  },
  {
    id: 'learning',
    name: 'Learning',
    description: 'Skills & progress tracking',
    icon: GraduationCap,
    path: '/learning',
    color: 'text-travel-nature',
    gradient: 'gradient-adventure'
  },
  {
    id: 'food',
    name: 'Food & Water',
    description: 'Culinary discoveries',
    icon: Utensils,
    path: '/food',
    color: 'text-travel-food',
    gradient: 'gradient-sunset'
  },
  {
    id: 'gear',
    name: 'Gear & Files',
    description: 'Equipment & screenshots',
    icon: Package,
    path: '/gear',
    color: 'text-muted-foreground',
    gradient: 'gradient-earth'
  }
];

export default function HomePage() {
  const [stats, setStats] = useState<ModuleStats>({
    travelPins: 0,
    people: 0,
    journalEntries: 0,
    expenses: 0,
    checklistItems: 0,
    learningEntries: 0,
    foodEntries: 0,
    gearItems: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      await database.init();
      
      const [
        travelPins,
        people,
        journalEntries,
        expenses,
        checklistItems,
        learningEntries,
        foodEntries,
        gearItems,
      ] = await Promise.all([
        database.getAll('travelPins'),
        database.getAll('people'),
        database.getAll('journalEntries'),
        database.getAll('expenses'),
        database.getAll('checklistItems'),
        database.getAll('learningEntries'),
        database.getAll('foodEntries'),
        database.getAll('gearItems'),
      ]);

      setStats({
        travelPins: travelPins.length,
        people: people.length,
        journalEntries: journalEntries.length,
        expenses: expenses.length,
        checklistItems: checklistItems.length,
        learningEntries: learningEntries.length,
        foodEntries: foodEntries.length,
        gearItems: gearItems.length,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalItems = () => {
    return Object.values(stats).reduce((sum, count) => sum + count, 0);
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
      {/* Hero Section */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 rounded-full gradient-sunset">
            <Compass className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-foreground mb-2">
          Travel Companion
        </h1>
        <p className="text-muted-foreground text-lg mb-6">
          Your personal offline travel intelligence hub
        </p>
        
        {/* Universal Search */}
        <div className="mb-6">
          <UniversalSearch />
        </div>

        {/* Quick Stats */}
        <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-primary" />
            <span>{getTotalItems()} total items</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-travel-adventure" />
            <span>8 modules</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-accent" />
            <span>100% offline</span>
          </div>
        </div>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {modules.map((module) => {
          const Icon = module.icon;
          const count = stats[module.id as keyof ModuleStats] || 0;
          
          return (
            <Link key={module.id} to={module.path}>
              <Card className="travel-card hover:scale-[1.02] transition-all duration-200 cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${module.gradient}`}>
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {module.name}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {module.description}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">{count}</div>
                      <div className="text-xs text-muted-foreground">items</div>
                    </div>
                  </div>
                </CardHeader>
                
                {count > 0 && (
                  <CardContent className="pt-0">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-travel-nature" />
                      <span className="text-sm text-muted-foreground">
                        {count === 1 ? 'Recently added' : 'Active collection'}
                      </span>
                    </div>
                  </CardContent>
                )}
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-xl">Quick Start</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Link to="/pins">
              <div className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                <MapPin className="h-6 w-6 text-travel-adventure mb-2" />
                <div className="font-medium">Add Travel Pin</div>
                <div className="text-sm text-muted-foreground">Mark a place you want to visit</div>
              </div>
            </Link>
            
            <Link to="/journal">
              <div className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                <BookOpen className="h-6 w-6 text-primary mb-2" />
                <div className="font-medium">Write Journal</div>
                <div className="text-sm text-muted-foreground">Capture today's experience</div>
              </div>
            </Link>
            
            <Link to="/people">
              <div className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                <Users className="h-6 w-6 text-travel-culture mb-2" />
                <div className="font-medium">Add Contact</div>
                <div className="text-sm text-muted-foreground">Remember someone you met</div>
              </div>
            </Link>
            
            <Link to="/expenses">
              <div className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer">
                <DollarSign className="h-6 w-6 text-travel-food mb-2" />
                <div className="font-medium">Log Expense</div>
                <div className="text-sm text-muted-foreground">Track your spending</div>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Features Highlight */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Intelligence Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-start gap-3">
              <Badge className="mt-1 bg-primary/10 text-primary">NLP</Badge>
              <div>
                <div className="font-medium">Natural Language Search</div>
                <div className="text-sm text-muted-foreground">
                  Search with phrases like "IT people in Pune" or "temples I want to visit"
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Badge className="mt-1 bg-travel-adventure/10 text-travel-adventure">Smart</Badge>
              <div>
                <div className="font-medium">Cross-Module Intelligence</div>
                <div className="text-sm text-muted-foreground">
                  Automatically links related data across all travel modules
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Badge className="mt-1 bg-accent/10 text-accent">Offline</Badge>
              <div>
                <div className="font-medium">100% Offline Capability</div>
                <div className="text-sm text-muted-foreground">
                  Works completely without internet using local storage
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}