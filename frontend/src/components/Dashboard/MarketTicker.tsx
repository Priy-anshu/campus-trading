import { useEffect, useState, useRef } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { ENDPOINTS, apiClient } from "@/api/config";
import Loader from "./Loader";
import ErrorCard from "./ErrorCard";

interface StockData {
  symbol: string;
  name?: string;
  lastPrice: number;
  change: number;
  pChange: number;
}

const MarketTicker = () => {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const animationRef = useRef<HTMLDivElement>(null);

  // Function to get or create persistent animation start time
  const getAnimationStartTime = () => {
    const storageKey = 'marketTickerStartTime';
    const sessionKey = 'marketTickerSessionTime';
    
    // Check if we have a global start time (survives HMR)
    if ((window as any).__marketTickerStartTime) {
      return (window as any).__marketTickerStartTime;
    }
    
    // First check sessionStorage (survives HMR but not full page refresh)
    const sessionStored = sessionStorage.getItem(sessionKey);
    if (sessionStored) {
      const startTime = parseInt(sessionStored);
      (window as any).__marketTickerStartTime = startTime;
      return startTime;
    }
    
    // Then check localStorage (survives full page refresh)
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const startTime = parseInt(stored);
      // Store in sessionStorage and global for HMR resilience
      sessionStorage.setItem(sessionKey, startTime.toString());
      (window as any).__marketTickerStartTime = startTime;
      return startTime;
    }
    
    // Create new start time
    const now = Date.now();
    localStorage.setItem(storageKey, now.toString());
    sessionStorage.setItem(sessionKey, now.toString());
    (window as any).__marketTickerStartTime = now;
    return now;
  };

  // Function to set animation position based on elapsed time
  const setAnimationPosition = () => {
    if (animationRef.current) {
      const startTime = getAnimationStartTime();
      const elapsed = Date.now() - startTime;
      
      // Different animation speeds for mobile vs desktop
      const isMobile = window.innerWidth < 768; // md breakpoint
      
      // Try to calculate optimal duration based on stock count
      let animationDuration = 300000; // Default: 5 minutes fallback
      let maxDistance = isMobile ? 7500 : 2000; // Default distances
      
      if (stocks.length > 0) {
        try {
          // Calculate the exact distance needed to show all stocks
          const stockCardWidth = 200; // min-w-[200px] from CSS
          const gap = 16; // gap-4 = 16px
          const totalStockWidth = stocks.length * (stockCardWidth + gap);
          const containerWidth = window.innerWidth;
          
          // Calculate how much distance we need to cover to show all stocks
          const totalDistanceNeeded = totalStockWidth + containerWidth;
          
          // Calculate duration based on speed preference (very fast)
          const mobileSpeed = 2000000; // pixels per second for mobile (ultra fast)
          const desktopSpeed = 1500000; // pixels per second for desktop (ultra fast)
          const speed = isMobile ? mobileSpeed : desktopSpeed;
          
          // Calculate duration needed to show all stocks at the desired speed
          const calculatedDuration = (totalDistanceNeeded / speed) * 1000; // convert to milliseconds
          
          // Use calculated duration (no min/max restrictions)
          animationDuration = Math.max(calculatedDuration, 10000); // At least 10 seconds minimum
          maxDistance = totalDistanceNeeded;
          console.log(`Using calculated duration: ${Math.round(animationDuration/1000)}s for ${stocks.length} stocks`);
        } catch (error) {
          console.log('Using fallback duration: 1 hour (calculation failed)');
        }
      }
      
      const progress = (elapsed % animationDuration) / animationDuration;
      const translateX = -progress * maxDistance;
      animationRef.current.style.transform = `translateX(${translateX}px)`;
    }
  };

  // Function to reset animation to start from NIFTY 200
  const resetAnimationToStart = () => {
    const now = Date.now();
    localStorage.setItem('marketTickerStartTime', now.toString());
    sessionStorage.setItem('marketTickerSessionTime', now.toString());
    (window as any).__marketTickerStartTime = now;
    
    if (animationRef.current) {
      animationRef.current.style.transform = 'translateX(0px)';
    }
  };

  // Initial data load (only runs once)
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await apiClient.get(ENDPOINTS.allStocks);
        
        // Handle different response structures
        let allStocks = [];
        if (response.data && Array.isArray(response.data)) {
          allStocks = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          allStocks = response.data.data;
        } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
          allStocks = response.data.data;
        } else {
          throw new Error('Invalid API response structure');
        }
        
        // Use all stocks instead of limiting to 10
        const finalStocks = allStocks;
        
        // Set stocks on initial load
        setStocks(finalStocks);
        setIsLoading(false);
        
        // Don't reset animation on navigation - let it continue from stored position
      } catch (err) {
        setError(true);
        setIsLoading(false);
      }
    };

    fetchStocks();
  }, []); // Empty dependency array - only runs once

  // Periodic refresh to update stock values using React state
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const response = await apiClient.get(ENDPOINTS.allStocks);
        
        let allStocks = [];
        if (response.data && Array.isArray(response.data)) {
          allStocks = response.data;
        } else if (response.data && response.data.data && Array.isArray(response.data.data)) {
          allStocks = response.data.data;
        } else if (response.data && response.data.success && Array.isArray(response.data.data)) {
          allStocks = response.data.data;
        }

        if (allStocks.length > 0) {
          // Update state properly using React pattern
          setStocks(allStocks);
        }
      } catch (err) {
        // Silently handle refresh errors
      }
    }, 15000); // Refresh every 15 seconds

    return () => clearInterval(interval);
  }, []); // Empty dependency array - runs independently

  // Set initial animation position and start animation (independent of stocks data)
  useEffect(() => {
    // Set initial position immediately
    setAnimationPosition();
    
    // Start the animation loop
    const animationInterval = setInterval(() => {
      setAnimationPosition();
    }, 100); // Update every 100ms for smooth animation

    return () => clearInterval(animationInterval);
  }, []); // Empty dependency array - animation runs independently

  // Cleanup storage on component unmount (optional)
  useEffect(() => {
    return () => {
      // Uncomment the lines below if you want to reset animation on component unmount
      // localStorage.removeItem('marketTickerStartTime');
      // sessionStorage.removeItem('marketTickerSessionTime');
      // delete (window as any).__marketTickerStartTime;
    };
  }, []);

  if (isLoading) return <Loader />;
  if (error) return <ErrorCard message="Stock data is temporarily unavailable. Please wait for one minute and try again." />;

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-background via-card/50 to-background">
      {/* Sliding Animation Container */}
      <div ref={animationRef} className="flex transition-none">
            {/* First set of stocks */}
            <div className="flex gap-4 min-w-max">
              {stocks.map((stock, index) => {
                const isPositive = (stock.change || 0) >= 0;
                return (
                  <div
                    key={`first-${stock.symbol}-${index}`}
                    data-stock-symbol={stock.symbol}
                    className="flex items-center gap-3 rounded-xl bg-card px-6 py-4 shadow-sm border border-border min-w-[200px] hover:shadow-md transition-all backdrop-blur-sm"
                  >
                    <div className="flex-1">
                      <p className="text-xs font-medium text-muted-foreground">{stock.symbol}</p>
                      {stock.name && (
                        <p className="text-[10px] text-muted-foreground/70 truncate max-w-[120px]">{stock.name}</p>
                      )}
                      <p data-price className="text-lg font-semibold text-foreground mt-1">
                        ₹{(stock.lastPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div data-pchange className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                      {isPositive ? (
                        <TrendingUp className="h-4 w-4" />
                      ) : (
                        <TrendingDown className="h-4 w-4" />
                      )}
                      <span data-change className="text-sm font-medium">
                        {isPositive ? '+' : ''}{(stock.pChange || 0).toFixed(2)}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
        
        {/* Duplicate set for seamless scrolling */}
        <div className="flex gap-4 min-w-max ml-8">
          {stocks.map((stock, index) => {
            const isPositive = (stock.change || 0) >= 0;
            return (
              <div
                key={`second-${stock.symbol}-${index}`}
                data-stock-symbol={stock.symbol}
                className="flex items-center gap-3 rounded-xl bg-card px-6 py-4 shadow-sm border border-border min-w-[200px] hover:shadow-md transition-all backdrop-blur-sm"
              >
                <div className="flex-1">
                  <p className="text-xs font-medium text-muted-foreground">{stock.symbol}</p>
                  {stock.name && (
                    <p className="text-[10px] text-muted-foreground/70 truncate max-w-[120px]">{stock.name}</p>
                  )}
                  <p data-price className="text-lg font-semibold text-foreground mt-1">
                    ₹{(stock.lastPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div data-pchange className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isPositive ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
                  <span data-change className="text-sm font-medium">
                    {isPositive ? '+' : ''}{(stock.pChange || 0).toFixed(2)}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MarketTicker;
