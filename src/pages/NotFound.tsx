import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Home, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-6">
          <div className="p-4 rounded-full gradient-sunset mx-auto w-fit mb-4">
            <Compass className="h-12 w-12 text-white" />
          </div>
        </div>
        
        <h1 className="text-6xl font-bold text-primary mb-2">404</h1>
        <h2 className="text-2xl font-semibold text-foreground mb-4">Route Not Found</h2>
        <p className="text-muted-foreground mb-8">
          Looks like this destination doesn't exist in your travel companion. 
          Let's get you back on track!
        </p>
        
        <div className="space-y-3">
          <Link to="/">
            <Button className="travel-button-primary w-full">
              <Home className="h-4 w-4 mr-2" />
              Return to Home Base
            </Button>
          </Link>
          
          <Link to="/pins">
            <Button variant="outline" className="w-full">
              <Compass className="h-4 w-4 mr-2" />
              Explore Travel Pins
            </Button>
          </Link>
        </div>
        
        <p className="text-xs text-muted-foreground mt-8">
          Path: {location.pathname}
        </p>
      </div>
    </div>
  );
};

export default NotFound;
