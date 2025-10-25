import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skull, Clock } from "lucide-react";

interface LoadingIndicatorProps {
  isLoading: boolean;
  timeout?: number; // Timeout in milliseconds
  children: React.ReactNode;
}

const LoadingIndicator = ({ 
  isLoading, 
  timeout = 5000, 
  children 
}: LoadingIndicatorProps) => {
  const [showSlowLoading, setShowSlowLoading] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setShowSlowLoading(false);
      const timer = setTimeout(() => {
        setShowSlowLoading(true);
      }, timeout);

      return () => clearTimeout(timer);
    } else {
      setShowSlowLoading(false);
    }
  }, [isLoading, timeout]);

  if (!isLoading) {
    return <>{children}</>;
  }

  if (showSlowLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4 max-w-md mx-auto p-8">
          <div className="flex justify-center">
            <Skull className="h-16 w-16 text-muted-foreground animate-pulse" />
          </div>
          
          <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-800">
            <Clock className="h-4 w-4" />
            <AlertDescription className="text-amber-800 dark:text-amber-200">
              <strong>⚠️ It's taking longer than usual. Please wait...</strong>
              <br />
              <span className="text-sm mt-1 block">
                The server might be cold starting or experiencing high load.
              </span>
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
            <p className="text-sm text-muted-foreground">
              Loading your data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingIndicator;
