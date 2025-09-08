import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MobileNavigation } from "@/components/layout/mobile-navigation";
import { AIChatWidget } from "@/components/ai-chat-widget";
import { database } from "@/lib/database";
import { useEffect } from "react";
import HomePage from "./pages/home";
import TravelPinsPage from "./pages/travel-pins";
import PeoplePage from "./pages/people";
import JournalPage from "./pages/journal";
import ExpensesPage from "./pages/expenses";
import ChecklistPage from "./pages/checklist";
import LearningPage from "./pages/learning";
import FoodPage from "./pages/food";
import GearPage from "./pages/gear";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    database.init().catch(console.error);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/pins" element={<TravelPinsPage />} />
              <Route path="/people" element={<PeoplePage />} />
              <Route path="/journal" element={<JournalPage />} />
              <Route path="/expenses" element={<ExpensesPage />} />
              <Route path="/checklist" element={<ChecklistPage />} />
              <Route path="/learning" element={<LearningPage />} />
              <Route path="/food" element={<FoodPage />} />
              <Route path="/gear" element={<GearPage />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            <MobileNavigation />
            <AIChatWidget />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
