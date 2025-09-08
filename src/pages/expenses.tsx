import { useState, useEffect } from 'react';
import { Plus, Search, DollarSign, TrendingUp, PieChart, Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { database, Expense } from '@/lib/database';
import { useToast } from '@/hooks/use-toast';
import { AIInteractionButton } from '@/components/ai-interaction-button';

const categoryColors = {
  food: 'bg-orange-500',
  transport: 'bg-blue-500',
  accommodation: 'bg-green-500',
  entertainment: 'bg-purple-500',
  shopping: 'bg-pink-500',
  other: 'bg-gray-500',
};

const categoryIcons = {
  food: '🍽️',
  transport: '🚌',
  accommodation: '🏨',
  entertainment: '🎭',
  shopping: '🛍️',
  other: '📦',
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    description: '',
    amount: 0,
    currency: 'USD',
    category: 'other',
    location: '',
    tags: []
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadExpenses();
    database.init();
  }, []);

  const loadExpenses = async () => {
    try {
      const data = await database.getAll<Expense>('expenses');
      setExpenses(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!newExpense.description?.trim() || !newExpense.amount) {
      toast({
        title: "Error",
        description: "Please enter description and amount",
        variant: "destructive",
      });
      return;
    }

    try {
      const expense: Expense = {
        id: Date.now().toString(),
        description: newExpense.description,
        amount: newExpense.amount,
        currency: newExpense.currency || 'USD',
        category: newExpense.category || 'other',
        location: newExpense.location,
        tags: newExpense.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await database.add('expenses', expense);
      setExpenses([expense, ...expenses]);
      setNewExpense({ description: '', amount: 0, currency: 'USD', category: 'other', location: '', tags: [] });
      setIsModalOpen(false);
      
      toast({
        title: "Success",
        description: "Expense saved!",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save expense",
        variant: "destructive",
      });
    }
  };

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expense.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         expense.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalAmount = filteredExpenses.reduce((sum, expense) => {
    // Simple conversion - in real app would use proper rates
    const baseAmount = expense.currency === 'USD' ? expense.amount : 
                      expense.currency === 'EUR' ? expense.amount * 1.1 :
                      expense.currency === 'INR' ? expense.amount * 0.012 :
                      expense.amount;
    return sum + baseAmount;
  }, 0);

  const categoryTotals = filteredExpenses.reduce((acc, expense) => {
    const baseAmount = expense.currency === 'USD' ? expense.amount : 
                      expense.currency === 'EUR' ? expense.amount * 1.1 :
                      expense.currency === 'INR' ? expense.amount * 0.012 :
                      expense.amount;
    acc[expense.category] = (acc[expense.category] || 0) + baseAmount;
    return acc;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-travel p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-48"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded"></div>)}
            </div>
            {[1,2,3].map(i => <div key={i} className="h-32 bg-muted rounded"></div>)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-travel p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <DollarSign className="h-8 w-8 text-travel-food" />
            <h1 className="text-3xl font-bold text-foreground">Expenses</h1>
          </div>
          <div className="flex gap-2">
            <AIInteractionButton 
              context="expenses" 
              placeholder="Ask AI to add expenses, analyze spending..."
            />
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full h-12 w-12 p-0">
                <Plus className="h-6 w-6" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    value={newExpense.description || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="What did you spend on?"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="amount">Amount</Label>
                    <Input
                      id="amount"
                      type="number"
                      step="0.01"
                      value={newExpense.amount || ''}
                      onChange={(e) => setNewExpense({ ...newExpense, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="currency">Currency</Label>
                    <Select value={newExpense.currency} onValueChange={(value) => setNewExpense({ ...newExpense, currency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="USD">USD ($)</SelectItem>
                        <SelectItem value="EUR">EUR (€)</SelectItem>
                        <SelectItem value="INR">INR (₹)</SelectItem>
                        <SelectItem value="GBP">GBP (£)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select value={newExpense.category} onValueChange={(value) => setNewExpense({ ...newExpense, category: value as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">🍽️ Food</SelectItem>
                      <SelectItem value="transport">🚌 Transport</SelectItem>
                      <SelectItem value="accommodation">🏨 Accommodation</SelectItem>
                      <SelectItem value="entertainment">🎭 Entertainment</SelectItem>
                      <SelectItem value="shopping">🛍️ Shopping</SelectItem>
                      <SelectItem value="other">📦 Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={newExpense.location || ''}
                    onChange={(e) => setNewExpense({ ...newExpense, location: e.target.value })}
                    placeholder="Where did you spend?"
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save Expense</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 glass-card">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-foreground">${totalAmount.toFixed(2)}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 glass-card">
            <div className="flex items-center gap-3">
              <PieChart className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold text-foreground">{Object.keys(categoryTotals).length}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 glass-card">
            <div className="flex items-center gap-3">
              <Calendar className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">
                  {filteredExpenses.filter(e => new Date(e.createdAt).getMonth() === new Date().getMonth()).length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search expenses..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 travel-input"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="travel-input">
              <SelectValue placeholder="All categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="food">🍽️ Food</SelectItem>
              <SelectItem value="transport">🚌 Transport</SelectItem>
              <SelectItem value="accommodation">🏨 Accommodation</SelectItem>
              <SelectItem value="entertainment">🎭 Entertainment</SelectItem>
              <SelectItem value="shopping">🛍️ Shopping</SelectItem>
              <SelectItem value="other">📦 Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Expenses List */}
        <div className="space-y-4">
          {filteredExpenses.length === 0 ? (
            <Card className="p-8 text-center glass-card">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery || categoryFilter !== 'all' ? 'No matching expenses' : 'No expenses yet'}
              </h3>
              <p className="text-muted-foreground mb-6">
                {searchQuery || categoryFilter !== 'all'
                  ? 'Try different search terms or clear filters.'
                  : 'Start tracking your travel expenses!'
                }
              </p>
              {!searchQuery && categoryFilter === 'all' && (
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Expense
                </Button>
              )}
            </Card>
          ) : (
            filteredExpenses.map((expense) => (
              <Card key={expense.id} className="p-4 glass-card hover:shadow-lg transition-all duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full ${categoryColors[expense.category]} flex items-center justify-center text-white text-xl`}>
                      {categoryIcons[expense.category]}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">{expense.description}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(expense.createdAt).toLocaleDateString()}</span>
                        {expense.location && (
                          <>
                            <span>•</span>
                            <span>📍 {expense.location}</span>
                          </>
                        )}
                      </div>
                      {expense.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {expense.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-foreground">
                      {expense.currency === 'USD' && '$'}
                      {expense.currency === 'EUR' && '€'}
                      {expense.currency === 'INR' && '₹'}
                      {expense.currency === 'GBP' && '£'}
                      {expense.amount.toFixed(2)}
                    </p>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${expense.category === 'food' ? 'border-orange-500' : 
                                            expense.category === 'transport' ? 'border-blue-500' :
                                            expense.category === 'accommodation' ? 'border-green-500' :
                                            expense.category === 'entertainment' ? 'border-purple-500' :
                                            expense.category === 'shopping' ? 'border-pink-500' :
                                            'border-gray-500'}`}
                    >
                      {expense.category}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}