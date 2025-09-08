import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  MapPin, 
  Users, 
  BookOpen, 
  DollarSign, 
  CheckSquare, 
  GraduationCap, 
  Utensils, 
  Package, 
  Plus,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const mainTabs = [
  { id: 'search', label: 'Search', icon: Search, path: '/' },
  { id: 'pins', label: 'Pins', icon: MapPin, path: '/pins' },
  { id: 'people', label: 'People', icon: Users, path: '/people' },
  { id: 'journal', label: 'Journal', icon: BookOpen, path: '/journal' },
];

const secondaryTabs = [
  { id: 'expenses', label: 'Budget', icon: DollarSign, path: '/expenses' },
  { id: 'checklist', label: 'Lists', icon: CheckSquare, path: '/checklist' },
  { id: 'learning', label: 'Learn', icon: GraduationCap, path: '/learning' },
  { id: 'food', label: 'Food', icon: Utensils, path: '/food' },
  { id: 'gear', label: 'Gear', icon: Package, path: '/gear' },
];

export function MobileNavigation() {
  const location = useLocation();
  const [showAllTabs, setShowAllTabs] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const visibleTabs = showAllTabs ? [...mainTabs, ...secondaryTabs] : mainTabs;

  return (
    <>
      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-md border-t border-border z-40">
        <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
          {visibleTabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                to={tab.path}
                className={cn(
                  'flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-0',
                  isActive(tab.path)
                    ? 'text-primary bg-primary/10'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                <span className="text-xs font-medium truncate">{tab.label}</span>
              </Link>
            );
          })}
          
          {!showAllTabs && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAllTabs(true)}
              className="flex flex-col items-center gap-1 px-3 py-2 text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-5 w-5" />
              <span className="text-xs font-medium">More</span>
            </Button>
          )}
        </div>
        
        {/* Show additional tabs when expanded */}
        {showAllTabs && (
          <div className="border-t border-border bg-muted/30">
            <div className="flex items-center justify-around px-2 py-2 max-w-md mx-auto">
              {secondaryTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.id}
                    to={tab.path}
                    onClick={() => setShowAllTabs(false)}
                    className={cn(
                      'flex flex-col items-center gap-1 px-2 py-2 rounded-lg transition-colors min-w-0',
                      isActive(tab.path)
                        ? 'text-primary bg-primary/10'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    <span className="text-xs font-medium truncate">{tab.label}</span>
                  </Link>
                );
              })}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAllTabs(false)}
                className="flex flex-col items-center gap-1 px-2 py-2 text-muted-foreground hover:text-foreground"
              >
                <span className="text-xs font-medium">Less</span>
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Add bottom padding to prevent content overlap */}
      <div className="h-20" />
    </>
  );
}