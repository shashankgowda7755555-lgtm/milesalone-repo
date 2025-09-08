import { PenTool, UserPlus, DollarSign, MapPin, BookOpen, CheckSquare, GraduationCap, Utensils } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { QuickAddModal } from './quick-add-modal';

const quickAddItems = [
  { id: 'journal', icon: PenTool, label: 'Journal', color: 'text-primary' },
  { id: 'person', icon: UserPlus, label: 'Person', color: 'text-travel-culture' },
  { id: 'expense', icon: DollarSign, label: 'Expense', color: 'text-travel-food' },
  { id: 'pin', icon: MapPin, label: 'Pin', color: 'text-travel-adventure' },
  { id: 'checklist', icon: CheckSquare, label: 'Task', color: 'text-accent' },
  { id: 'learning', icon: GraduationCap, label: 'Learn', color: 'text-travel-nature' },
  { id: 'food', icon: Utensils, label: 'Food', color: 'text-travel-food' },
  { id: 'gear', icon: BookOpen, label: 'Gear', color: 'text-muted-foreground' },
];

export function QuickAdd() {
  const [selectedType, setSelectedType] = useState<string | null>(null);

  return (
    <>
      <Card className="p-4 glass-card">
        <h3 className="font-semibold text-lg mb-4 text-foreground">Quick Add</h3>
        <div className="grid grid-cols-4 gap-3">
          {quickAddItems.map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant="ghost"
                className="flex flex-col items-center justify-center h-20 hover:bg-muted/60 transition-all duration-200 hover:scale-105"
                onClick={() => setSelectedType(item.id)}
              >
                <Icon className={`h-6 w-6 mb-2 ${item.color}`} />
                <span className="text-xs font-medium text-foreground">{item.label}</span>
              </Button>
            );
          })}
        </div>
      </Card>

      {selectedType && (
        <QuickAddModal
          type={selectedType}
          isOpen={!!selectedType}
          onClose={() => setSelectedType(null)}
        />
      )}
    </>
  );
}